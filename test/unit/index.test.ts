import { Locks, LockNotGrantedError, locks } from '../../src/index'

jest.mock('@deliveryhero/dynamodb-lock')
jest.mock('@360mediadirect/log')
jest.mock('aws-sdk')

describe('index.ts exports', () => {
  it('should export Locks class', () => {
    expect(Locks).toBeDefined()
    expect(typeof Locks).toBe('function')
  })

  it('should export LockNotGrantedError', () => {
    expect(LockNotGrantedError).toBeDefined()
    expect(typeof LockNotGrantedError).toBe('function')
  })

  it('should export locks singleton instance', () => {
    expect(locks).toBeDefined()
    expect(locks).toBeInstanceOf(Locks)
  })

  it('should create locks singleton with default configuration', () => {
    // The locks singleton should be an instance of Locks
    expect(locks).toBeInstanceOf(Locks)
    // It should have acquire and child methods
    expect(typeof locks.acquire).toBe('function')
    expect(typeof locks.child).toBe('function')
  })
})
