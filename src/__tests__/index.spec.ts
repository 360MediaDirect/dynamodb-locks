import { Locks, locks } from '../index'

describe('index', () => {
  // TODO: More tests
  it('exports an instance with an acquire function', () => {
    expect(locks).toBeInstanceOf(Locks)
    expect(locks).toHaveProperty('acquire')
  })
})
