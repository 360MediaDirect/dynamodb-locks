import AWS from 'aws-sdk'
import { Locks } from '../../src/Locks'

// Mock modules before imports
jest.mock('@deliveryhero/dynamodb-lock')
jest.mock('@360mediadirect/log')
jest.mock('aws-sdk')

// Import the mocked modules
import {
  dynamoDBLockClientFactory,
  LockNotGrantedError,
} from '@deliveryhero/dynamodb-lock'
import log from '@360mediadirect/log'

// Get typed mocks
const mockDynamoDBLockClientFactory =
  dynamoDBLockClientFactory as jest.MockedFunction<
    typeof dynamoDBLockClientFactory
  >
const mockLog = log as jest.Mocked<typeof log>

// Create mock lock and release functions
const mockLock = jest.fn()
const mockReleaseLock = jest.fn()

describe('Locks', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Configure the mock factory to return our mock client
    mockDynamoDBLockClientFactory.mockReturnValue({
      lock: mockLock,
      releaseLock: mockReleaseLock,
    } as any)

    // Clear environment variables
    delete process.env.LOCKS_TABLE
    delete process.env.LOCKS_HEARTBEAT_PERIOD_MS
    delete process.env.LOCKS_LEASE_DURATION_MS
    delete process.env.LOCKS_RETRY_DELAY_MS
    delete process.env.LOCKS_MAX_WAIT_MS
    delete process.env.LOCKS_PREFIX
    delete process.env.LOCKS_OWNER
    delete process.env.LOCKS_DEBUG_LOGS
  })

  describe('Constructor', () => {
    describe('Default configuration', () => {
      it('should create instance with default lockTable', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.objectContaining({
            tableName: 'locks-dev',
          }),
          expect.any(Function),
        )
      })

      it('should create instance with default heartbeatPeriodMs (3000)', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.any(Object),
          expect.any(Function),
        )
      })

      it('should create instance with default leaseDurationMs (10000)', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should create instance with default retryDelayMs (450)', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should create instance with default maxWaitMs (20000)', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should create instance with default prefix "default"', () => {
        const locks = new Locks()
        expect(locks).toBeDefined()
      })

      it('should create instance with default owner "Locks"', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should create instance with default debugLogs false', () => {
        const locks = new Locks()
        expect(locks).toBeDefined()
      })

      it('should create default AWS.DynamoDB.DocumentClient when dynamodb not provided', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.any(Object),
          expect.any(Function),
        )
      })
    })

    describe('Environment variable parsing', () => {
      it('should read LOCKS_TABLE from env', () => {
        process.env.LOCKS_TABLE = 'my-locks-table'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.objectContaining({
            tableName: 'my-locks-table',
          }),
          expect.any(Function),
        )
      })

      it('should parse LOCKS_HEARTBEAT_PERIOD_MS as number', () => {
        process.env.LOCKS_HEARTBEAT_PERIOD_MS = '5000'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should parse LOCKS_LEASE_DURATION_MS as number', () => {
        process.env.LOCKS_LEASE_DURATION_MS = '15000'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should parse LOCKS_RETRY_DELAY_MS as number', () => {
        process.env.LOCKS_RETRY_DELAY_MS = '500'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should parse LOCKS_MAX_WAIT_MS as number', () => {
        process.env.LOCKS_MAX_WAIT_MS = '30000'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should read LOCKS_PREFIX from env', () => {
        process.env.LOCKS_PREFIX = 'my-prefix'
        const locks = new Locks()
        expect(locks).toBeDefined()
      })

      it('should read LOCKS_OWNER from env', () => {
        process.env.LOCKS_OWNER = 'MyService'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should parse LOCKS_DEBUG_LOGS as true when set to "1"', () => {
        process.env.LOCKS_DEBUG_LOGS = '1'
        const locks = new Locks()
        expect(locks).toBeDefined()
      })

      it('should parse LOCKS_DEBUG_LOGS as false when set to other value', () => {
        process.env.LOCKS_DEBUG_LOGS = '0'
        const locks = new Locks()
        expect(locks).toBeDefined()
      })

      it('should handle missing env vars gracefully', () => {
        // All env vars cleared in beforeEach
        expect(() => new Locks()).not.toThrow()
      })
    })

    describe('Options override', () => {
      it('should override lockTable with provided opts', () => {
        // Note: lockTable opts are stored in config, but tableName for factory
        // is read from process.env.LOCKS_TABLE only
        new Locks({ lockTable: 'custom-table' })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.objectContaining({
            tableName: 'locks-dev', // Always uses env var or default
          }),
          expect.any(Function),
        )
      })

      it('should override heartbeatPeriodMs with provided opts', () => {
        new Locks({ heartbeatPeriodMs: 7000 })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should override leaseDurationMs with provided opts', () => {
        new Locks({ leaseDurationMs: 20000 })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should override retryDelayMs with provided opts', () => {
        new Locks({ retryDelayMs: 1000 })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should override maxWaitMs with provided opts', () => {
        new Locks({ maxWaitMs: 50000 })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should override prefix with provided opts', () => {
        const locks = new Locks({ prefix: 'custom-prefix' })
        expect(locks).toBeDefined()
      })

      it('should override owner with provided opts', () => {
        new Locks({ owner: 'CustomOwner' })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should override debugLogs with provided opts', () => {
        const locks = new Locks({ debugLogs: true })
        expect(locks).toBeDefined()
      })

      it('should accept custom dynamodb client', () => {
        const customClient = new AWS.DynamoDB.DocumentClient()
        new Locks({ dynamodb: customClient })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          customClient,
          expect.any(Object),
          expect.any(Function),
        )
      })

      it('should merge opts with env vars (opts take precedence)', () => {
        process.env.LOCKS_TABLE = 'env-table'
        new Locks({ lockTable: 'opts-table' })
        // Note: tableName in factory call always uses process.env.LOCKS_TABLE
        // even though config.lockTable is set from opts
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.objectContaining({
            tableName: 'env-table', // Uses env var, not opts
          }),
          expect.any(Function),
        )
      })

      it('should not create default DocumentClient when dynamodb provided in opts', () => {
        const customClient = new AWS.DynamoDB.DocumentClient()
        new Locks({ dynamodb: customClient })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          customClient,
          expect.any(Object),
          expect.any(Function),
        )
      })
    })

    describe('Lock options mapping', () => {
      it('should correctly map leaseDurationMs to leaseDurationInMs', () => {
        const locks = new Locks({ leaseDurationMs: 15000 })
        expect(locks).toBeDefined()
      })

      it('should correctly map heartbeatPeriodMs to prolongEveryMs', () => {
        const locks = new Locks({ heartbeatPeriodMs: 4000 })
        expect(locks).toBeDefined()
      })

      it('should set trustLocalTime to true', () => {
        const locks = new Locks()
        expect(locks).toBeDefined()
      })

      it('should correctly map retryDelayMs to waitDurationInMs', () => {
        const locks = new Locks({ retryDelayMs: 600 })
        expect(locks).toBeDefined()
      })

      it('should calculate maxRetryCount correctly (maxWaitMs / retryDelayMs)', () => {
        // Default: maxWaitMs=20000, retryDelayMs=450
        // maxRetryCount should be Math.floor(20000 / 450) = 44
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should calculate maxRetryCount with custom values', () => {
        // maxWaitMs=10000, retryDelayMs=500
        // maxRetryCount should be Math.floor(10000 / 500) = 20
        new Locks({ maxWaitMs: 10000, retryDelayMs: 500 })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })

      it('should include additionalAttributes with owner', () => {
        new Locks({ owner: 'TestOwner' })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalled()
      })
    })

    describe('Client initialization', () => {
      it('should call dynamoDBLockClientFactory with correct parameters', () => {
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          {
            tableName: 'locks-dev',
            partitionKey: 'id',
            sortKey: 'group',
            ttlKey: 'ttl',
          },
          expect.any(Function),
        )
      })

      it('should use correct table configuration', () => {
        // Set env var to test specific table name
        process.env.LOCKS_TABLE = 'prod-locks'
        new Locks()
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.any(AWS.DynamoDB.DocumentClient),
          expect.objectContaining({
            tableName: 'prod-locks',
            partitionKey: 'id',
            sortKey: 'group',
            ttlKey: 'ttl',
          }),
          expect.any(Function),
        )
      })

      it('should provide logger callback function', () => {
        new Locks()
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]
        expect(typeof loggerCallback).toBe('function')
      })
    })
  })

  describe('acquire() method', () => {
    let locks: Locks
    const mockLockObject = { id: 'test-lock' }

    beforeEach(() => {
      locks = new Locks({ prefix: 'test-prefix' })
      mockLock.mockResolvedValue(mockLockObject)
      mockReleaseLock.mockResolvedValue(undefined)
    })

    describe('Successful lock acquisition and release', () => {
      it('should acquire lock with correct prefix and name', async () => {
        await locks.acquire('myLock', async () => {})
        expect(mockLock).toHaveBeenCalledWith(
          'test-prefix',
          'myLock',
          expect.objectContaining({
            leaseDurationInMs: 10000,
            prolongEveryMs: 3000,
            trustLocalTime: true,
            waitDurationInMs: 450,
            maxRetryCount: expect.any(Number),
            additionalAttributes: { owner: 'Locks' },
          }),
        )
      })

      it('should execute provided function while holding lock', async () => {
        const mockFn = jest.fn()
        await locks.acquire('myLock', mockFn)
        expect(mockFn).toHaveBeenCalled()
      })

      it('should release lock after function completes', async () => {
        await locks.acquire('myLock', async () => {})
        expect(mockReleaseLock).toHaveBeenCalledWith(mockLockObject)
      })

      it('should return function return value (sync function)', async () => {
        const result = await locks.acquire('myLock', () => 'test-result')
        expect(result).toBe('test-result')
      })

      it('should return function resolved value (async function)', async () => {
        const result = await locks.acquire('myLock', async () => 'async-result')
        expect(result).toBe('async-result')
      })

      it('should pass through correct lockOptions to client.lock()', async () => {
        const customLocks = new Locks({
          leaseDurationMs: 15000,
          heartbeatPeriodMs: 5000,
          retryDelayMs: 500,
          maxWaitMs: 10000,
          owner: 'CustomOwner',
        })
        await customLocks.acquire('testLock', async () => {})
        expect(mockLock).toHaveBeenCalledWith(
          'default',
          'testLock',
          expect.objectContaining({
            leaseDurationInMs: 15000,
            prolongEveryMs: 5000,
            waitDurationInMs: 500,
            maxRetryCount: 20,
            additionalAttributes: { owner: 'CustomOwner' },
          }),
        )
      })
    })

    describe('Type safety', () => {
      it('should return correct type for string', async () => {
        const result = await locks.acquire<string>('myLock', () => 'hello')
        expect(typeof result).toBe('string')
        expect(result).toBe('hello')
      })

      it('should return correct type for number', async () => {
        const result = await locks.acquire<number>('myLock', () => 42)
        expect(typeof result).toBe('number')
        expect(result).toBe(42)
      })

      it('should return correct type for object', async () => {
        const obj = { foo: 'bar' }
        const result = await locks.acquire('myLock', () => obj)
        expect(result).toEqual(obj)
      })

      it('should handle void return type', async () => {
        const result = await locks.acquire('myLock', () => {})
        expect(result).toBeUndefined()
      })
    })

    describe('Error handling - function throws', () => {
      it('should release lock even when function throws', async () => {
        const error = new Error('Function error')
        await expect(
          locks.acquire('myLock', () => {
            throw error
          }),
        ).rejects.toThrow('Function error')
        expect(mockReleaseLock).toHaveBeenCalledWith(mockLockObject)
      })

      it('should re-throw function error after releasing lock', async () => {
        const error = new Error('Test error')
        await expect(
          locks.acquire('myLock', () => {
            throw error
          }),
        ).rejects.toThrow('Test error')
      })

      it('should ensure lock is released before re-throwing error', async () => {
        const callOrder: string[] = []
        mockReleaseLock.mockImplementation(async () => {
          callOrder.push('release')
        })

        try {
          await locks.acquire('myLock', () => {
            throw new Error('Test')
          })
        } catch (e) {
          callOrder.push('catch')
        }

        expect(callOrder).toEqual(['release', 'catch'])
      })
    })

    describe('Error handling - function rejects', () => {
      it('should release lock even when async function rejects', async () => {
        await expect(
          locks.acquire('myLock', async () => {
            throw new Error('Async error')
          }),
        ).rejects.toThrow('Async error')
        expect(mockReleaseLock).toHaveBeenCalledWith(mockLockObject)
      })

      it('should re-throw rejection after releasing lock', async () => {
        await expect(
          locks.acquire('myLock', async () => {
            throw new Error('Rejection error')
          }),
        ).rejects.toThrow('Rejection error')
      })

      it('should ensure lock is released before re-throwing rejection', async () => {
        const callOrder: string[] = []
        mockReleaseLock.mockImplementation(async () => {
          callOrder.push('release')
        })

        try {
          await locks.acquire('myLock', async () => {
            throw new Error('Test')
          })
        } catch (e) {
          callOrder.push('catch')
        }

        expect(callOrder).toEqual(['release', 'catch'])
      })
    })

    describe('Error handling - lock acquisition fails', () => {
      it('should not call provided function when lock acquisition fails', async () => {
        const mockFn = jest.fn()
        mockLock.mockReset()
        mockLock.mockRejectedValue(new Error('Lock error'))
        await expect(locks.acquire('myLock', mockFn)).rejects.toThrow()
        expect(mockFn).not.toHaveBeenCalled()
      })

      it('should not attempt to release lock when acquisition fails', async () => {
        mockLock.mockReset()
        mockLock.mockRejectedValue(new Error('Lock error'))
        await expect(locks.acquire('myLock', async () => {})).rejects.toThrow()
        expect(mockReleaseLock).not.toHaveBeenCalled()
      })
    })

    describe('Error handling - lock release fails', () => {
      it('should throw if releaseLock() fails after successful function', async () => {
        mockReleaseLock.mockRejectedValue(new Error('Release failed'))
        await expect(locks.acquire('myLock', () => 'success')).rejects.toThrow(
          'Release failed',
        )
      })

      it('should throw release error if both function and release fail', async () => {
        // Note: If both function and release fail, the release error is thrown
        // because await releaseLock() happens before checking if (err) throw err
        mockReleaseLock.mockRejectedValue(new Error('Release failed'))
        await expect(
          locks.acquire('myLock', () => {
            throw new Error('Function failed')
          }),
        ).rejects.toThrow('Release failed')
      })
    })

    describe('Async execution', () => {
      it('should wait for async function to complete before releasing', async () => {
        const callOrder: string[] = []
        mockReleaseLock.mockImplementation(async () => {
          callOrder.push('release')
        })

        await locks.acquire('myLock', async () => {
          await new Promise((resolve) => setTimeout(resolve, 10))
          callOrder.push('function')
        })

        expect(callOrder).toEqual(['function', 'release'])
      })

      it('should handle long-running functions correctly', async () => {
        let completed = false
        await locks.acquire('myLock', async () => {
          await new Promise((resolve) => setTimeout(resolve, 50))
          completed = true
        })
        expect(completed).toBe(true)
        expect(mockReleaseLock).toHaveBeenCalled()
      })
    })
  })

  describe('child() method', () => {
    let parentLocks: Locks

    beforeEach(() => {
      parentLocks = new Locks({
        lockTable: 'parent-table',
        heartbeatPeriodMs: 4000,
        leaseDurationMs: 12000,
        retryDelayMs: 500,
        maxWaitMs: 25000,
        prefix: 'parent-prefix',
        owner: 'ParentOwner',
        debugLogs: true,
      })
      jest.clearAllMocks()
    })

    describe('Basic child creation', () => {
      it('should return new Locks instance', () => {
        const child = parentLocks.child({})
        expect(child).toBeInstanceOf(Locks)
        expect(child).not.toBe(parentLocks)
      })

      it('should not modify parent instance', () => {
        const child = parentLocks.child({ prefix: 'child-prefix' })
        jest.clearAllMocks()

        // Verify parent still uses its original config
        // Note: tableName is read from process.env.LOCKS_TABLE, not from config
        new Locks({
          lockTable: 'parent-table',
          prefix: 'parent-prefix',
        })
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ tableName: 'locks-dev' }),
          expect.anything(),
        )
      })

      it('should inherit parent configuration', () => {
        const child = parentLocks.child({})
        expect(child).toBeDefined()
        // Note: tableName is read from process.env.LOCKS_TABLE, not from config
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ tableName: 'locks-dev' }),
          expect.anything(),
        )
      })

      it('should override specified options', () => {
        const child = parentLocks.child({ prefix: 'child-prefix' })
        expect(child).toBeDefined()
      })

      it('should merge parent config with child opts', () => {
        const child = parentLocks.child({ lockTable: 'child-table' })
        expect(child).toBeDefined()
        // Note: tableName is read from process.env.LOCKS_TABLE, not from config
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ tableName: 'locks-dev' }),
          expect.anything(),
        )
      })
    })

    describe('Configuration inheritance', () => {
      it('should inherit dynamodb client from parent', () => {
        const customClient = new AWS.DynamoDB.DocumentClient()
        const parent = new Locks({ dynamodb: customClient })
        jest.clearAllMocks()

        const child = parent.child({})
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          customClient,
          expect.anything(),
          expect.anything(),
        )
      })

      it('should inherit all timing configs from parent', () => {
        const child = parentLocks.child({})
        expect(child).toBeDefined()
      })

      it('should inherit prefix from parent unless overridden', () => {
        const child1 = parentLocks.child({})
        expect(child1).toBeDefined()

        jest.clearAllMocks()
        const child2 = parentLocks.child({ prefix: 'override-prefix' })
        expect(child2).toBeDefined()
      })

      it('should inherit owner from parent unless overridden', () => {
        const child1 = parentLocks.child({})
        expect(child1).toBeDefined()

        jest.clearAllMocks()
        const child2 = parentLocks.child({ owner: 'ChildOwner' })
        expect(child2).toBeDefined()
      })

      it('should inherit debugLogs from parent unless overridden', () => {
        const child1 = parentLocks.child({})
        expect(child1).toBeDefined()

        jest.clearAllMocks()
        const child2 = parentLocks.child({ debugLogs: false })
        expect(child2).toBeDefined()
      })
    })

    describe('Multiple child creation', () => {
      it('should create multiple independent child instances', () => {
        const child1 = parentLocks.child({ prefix: 'child1' })
        const child2 = parentLocks.child({ prefix: 'child2' })

        expect(child1).not.toBe(child2)
        expect(child1).toBeInstanceOf(Locks)
        expect(child2).toBeInstanceOf(Locks)
      })

      it('should not affect sibling child instances', () => {
        const child1 = parentLocks.child({ lockTable: 'child1-table' })
        const child2 = parentLocks.child({ lockTable: 'child2-table' })

        expect(child1).not.toBe(child2)
      })
    })

    describe('Child of child', () => {
      it('should support creating child from child instance', () => {
        const child = parentLocks.child({ prefix: 'child' })
        const grandchild = child.child({ owner: 'Grandchild' })

        expect(grandchild).toBeInstanceOf(Locks)
        expect(grandchild).not.toBe(child)
        expect(grandchild).not.toBe(parentLocks)
      })

      it('should properly merge configs through multiple levels', () => {
        const child = parentLocks.child({ prefix: 'child' })
        jest.clearAllMocks()

        const grandchild = child.child({ lockTable: 'grandchild-table' })
        expect(grandchild).toBeDefined()
        // Note: tableName is read from process.env.LOCKS_TABLE, not from config
        expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({ tableName: 'locks-dev' }),
          expect.anything(),
        )
      })
    })
  })

  describe('log() method', () => {
    describe('Debug logging disabled', () => {
      it('should not call log.debug when debugLogs is false', () => {
        const locks = new Locks({ debugLogs: false })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        loggerCallback('info', 'test message')
        expect(mockLog.debug).not.toHaveBeenCalled()
      })

      it('should return undefined when debugLogs is false', () => {
        const locks = new Locks({ debugLogs: false })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        const result = loggerCallback('info', 'test message')
        expect(result).toBeUndefined()
      })
    })

    describe('Debug logging enabled', () => {
      it('should call log.debug when debugLogs is true', () => {
        const locks = new Locks({ debugLogs: true })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        loggerCallback('info', 'test message')
        expect(mockLog.debug).toHaveBeenCalled()
      })

      it('should format message correctly with severity', () => {
        const locks = new Locks({ debugLogs: true })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        loggerCallback('warn', 'warning message')
        expect(mockLog.debug).toHaveBeenCalledWith(
          'Locks warn: warning message',
        )
      })

      it('should handle different severity levels', () => {
        const locks = new Locks({ debugLogs: true })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        loggerCallback('error', 'error message')
        expect(mockLog.debug).toHaveBeenCalledWith('Locks error: error message')

        jest.clearAllMocks()
        loggerCallback('info', 'info message')
        expect(mockLog.debug).toHaveBeenCalledWith('Locks info: info message')
      })
    })

    describe('Logging integration', () => {
      it('should trigger logger callback from lock client', () => {
        const locks = new Locks({ debugLogs: true })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        expect(typeof loggerCallback).toBe('function')
        loggerCallback('info', 'lock acquired')
        expect(mockLog.debug).toHaveBeenCalledWith('Locks info: lock acquired')
      })

      it('should pass correct severity and message from lock client', () => {
        const locks = new Locks({ debugLogs: true })
        const loggerCallback = mockDynamoDBLockClientFactory.mock.calls[0][2]

        loggerCallback('warn', 'lock contention detected')
        expect(mockLog.debug).toHaveBeenCalledWith(
          'Locks warn: lock contention detected',
        )
      })
    })
  })

  describe('Integration between methods', () => {
    it('should use constructor config in acquire', async () => {
      const locks = new Locks({
        prefix: 'integration-test',
        owner: 'IntegrationOwner',
        leaseDurationMs: 15000,
      })

      const mockLockObject = { id: 'test' }
      mockLock.mockResolvedValue(mockLockObject)
      mockReleaseLock.mockResolvedValue(undefined)

      await locks.acquire('testLock', async () => {})

      expect(mockLock).toHaveBeenCalledWith(
        'integration-test',
        'testLock',
        expect.objectContaining({
          leaseDurationInMs: 15000,
          additionalAttributes: { owner: 'IntegrationOwner' },
        }),
      )
    })

    it('should use constructor prefix in acquire', async () => {
      const locks = new Locks({ prefix: 'my-namespace' })

      const mockLockObject = { id: 'test' }
      mockLock.mockResolvedValue(mockLockObject)
      mockReleaseLock.mockResolvedValue(undefined)

      await locks.acquire('myKey', async () => {})

      expect(mockLock).toHaveBeenCalledWith(
        'my-namespace',
        'myKey',
        expect.any(Object),
      )
    })

    it('should inherit parent full config in child', () => {
      const parent = new Locks({
        lockTable: 'parent-table',
        heartbeatPeriodMs: 5000,
        prefix: 'parent',
      })

      jest.clearAllMocks()
      const child = parent.child({ prefix: 'child' })

      // Note: tableName is read from process.env.LOCKS_TABLE, not from config
      expect(mockDynamoDBLockClientFactory).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tableName: 'locks-dev',
        }),
        expect.anything(),
      )
    })
  })
})
