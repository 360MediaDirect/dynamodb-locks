import AWS from 'aws-sdk'
import {
  dynamoDBLockClientFactory,
  LockClient,
  LockOptions
} from '@deliveryhero/dynamodb-lock'
import log from '@360mediadirect/log'

export { LockNotGrantedError } from '@deliveryhero/dynamodb-lock'
export type LockedFunction<T> = () => T | Promise<T>
export type MaybeError = Error | undefined
export interface Lock {
  on: (event: string, fn: (data: any) => void) => void
  release: (fn?: (err: MaybeError) => void) => void
}
export interface LocksOpts {
  dynamodb: AWS.DynamoDB.DocumentClient
  lockTable: string
  heartbeatPeriodMs: number
  leaseDurationMs: number
  retryDelayMs: number
  maxWaitMs: number
  prefix: string
  owner: string
  debugLogs: boolean
}

export class Locks {
  private client: LockClient
  private prefix: string
  private config: LocksOpts
  private lockOptions: LockOptions

  constructor(opts: Partial<LocksOpts> = {}) {
    this.config = {
      lockTable: process.env.LOCKS_TABLE || 'locks-dev',
      heartbeatPeriodMs: process.env.LOCKS_HEARTBEAT_PERIOD_MS
        ? +process.env.LOCKS_HEARTBEAT_PERIOD_MS
        : 3e3,
      leaseDurationMs: process.env.LOCKS_LEASE_DURATION_MS
        ? +process.env.LOCKS_LEASE_DURATION_MS
        : 10e3,
      retryDelayMs: process.env.LOCKS_RETRY_DELAY_MS
        ? +process.env.LOCKS_RETRY_DELAY_MS
        : 450,
      maxWaitMs: process.env.LOCKS_MAX_WAIT_MS
        ? +process.env.LOCKS_MAX_WAIT_MS
        : 20e3,
      prefix: process.env.LOCKS_PREFIX || 'default',
      owner: process.env.LOCKS_OWNER || 'Locks',
      debugLogs: process.env.LOCKS_DEBUG_LOGS === '1',
      ...opts,
      ...(!opts.dynamodb && { dynamodb: new AWS.DynamoDB.DocumentClient() })
    }
    this.prefix = this.config.prefix
    this.lockOptions = {
      leaseDurationInMs: this.config.leaseDurationMs,
      prolongEveryMs: this.config.heartbeatPeriodMs,
      trustLocalTime: true,
      waitDurationInMs: this.config.retryDelayMs,
      maxRetryCount: Math.floor(
        this.config.maxWaitMs / this.config.retryDelayMs
      ),
      additionalAttributes: {
        owner: this.config.owner
      }
    }
    this.client = dynamoDBLockClientFactory(
      this.config.dynamodb,
      {
        tableName: process.env.LOCKS_TABLE || 'locks-dev',
        partitionKey: 'id',
        sortKey: 'group',
        ttlKey: 'ttl'
      },
      (severity, message) => {
        this.log(severity, message)
      }
    )
  }

  /**
   * Acquires a named lock and holds it while a given function executes. Once
   * the function completes, whether sync or async, the lock will be released.
   *
   * Locks will heartbeat to stay "held" as long as the function has not
   * terminated. Should the process crash, the lock will eventually release
   * itself once the lease period has expired and be available to another
   * process.
   *
   * This call will throw any errors thrown by the locked function, as well as
   * any errors encountered while trying to obtain the lock. A try...catch block
   * around the entire acquire function call will catch both error types.
   *
   * The acquire call will return whatever the LockedFunction returns. If proper
   * typing is used, TypeScript will properly complain if the wrong type is
   * returned.
   *
   * @example
   *   console.log('This next part is resource-sensitive')
   *   await acquire('myResource', async () => {
   *     console.log('I have the lock and can now use my resource safely!')
   *     await doSomething()
   *   })
   *   console.log('The myResource lock is available again')
   * @example
   *   try {
   *     await acquire('myResource', () => {
   *       throw new Error('This will be caught!')
   *     })
   *   } catch (e) {
   *     console.log(e.message) // "This will be caught!"
   *   }
   * @example
   *   const key = await acquire<string>('abc', () => getSomeString())
   *   // Or...
   *   const key: string = await acquire('abc', () => getSomeString())
   *   // Both of the above will fail to compile if a non-string is returned
   * @param name - The name of the lock to be acquired
   * @param fn - A function to be executed while the lock is in possession
   * @returns whatever is returned from the LockedFunction.
   */
  async acquire<T = void>(name: string, fn: LockedFunction<T>): Promise<T> {
    const lock = await this.client.lock(this.prefix, name, this.lockOptions)
    let err: Error
    let res: T
    try {
      res = await fn()
    } catch (fnErr) {
      err = fnErr
    }
    await this.client.releaseLock(lock)
    if (err) throw err
    return res
  }

  /**
   * Creates a new instance of Locks with additional settings layered over the
   * current instance's settings.
   *
   * @example
   *   const locks = currentInst.child({ prefix: 'myNamespace-' })
   *   await locks.acquire('myKey', () => {})
   *   // The above gets a lock on "myNamespace-myKey". Otherwise, all other
   *   // options from the currentInst instance still apply.
   * @param opts - The option overrides to apply to the current config
   * @returns A new Locks instance with the option overrides applied
   */
  child(opts: Partial<LocksOpts>): Locks {
    return new Locks({ ...this.config, ...opts })
  }

  private log(severity: string, message: string) {
    if (!this.config.debugLogs) return undefined
    log.debug(`Locks ${severity}: ${message}`)
  }
}
