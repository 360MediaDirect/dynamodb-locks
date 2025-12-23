export class LockNotGrantedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LockNotGrantedError'
  }
}

export const mockLock = jest.fn()
export const mockReleaseLock = jest.fn()

const mockClient = {
  lock: mockLock,
  releaseLock: mockReleaseLock,
}

export const dynamoDBLockClientFactory = jest.fn(() => mockClient)
