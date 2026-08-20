import { beforeEach, describe, expect, it } from 'vitest'
import { loadStats, recordResult, winPercentage } from './stats'

// vitest's default 'node' environment doesn't provide localStorage — stub a
// minimal in-memory version so this module's persistence path is covered.
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  clear() {
    this.store.clear()
  }
}

beforeEach(() => {
  // @ts-expect-error -- test-only global shim
  globalThis.localStorage = new MemoryStorage()
})

describe('loadStats', () => {
  it('returns zeroed stats when nothing is stored', () => {
    expect(loadStats('wild-cards')).toEqual({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 })
  })

  it('is scoped per game id', () => {
    recordResult('wild-cards', true)
    expect(loadStats('some-other-game')).toEqual({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 })
  })
})

describe('recordResult', () => {
  it('increments wins and the current/best streak on a win', () => {
    let stats = recordResult('wild-cards', true)
    expect(stats).toEqual({ wins: 1, losses: 0, currentStreak: 1, bestStreak: 1 })
    stats = recordResult('wild-cards', true)
    expect(stats).toEqual({ wins: 2, losses: 0, currentStreak: 2, bestStreak: 2 })
  })

  it('resets the current streak but keeps the best streak on a loss', () => {
    recordResult('wild-cards', true)
    recordResult('wild-cards', true)
    const stats = recordResult('wild-cards', false)
    expect(stats).toEqual({ wins: 2, losses: 1, currentStreak: 0, bestStreak: 2 })
  })

  it('persists across separate loadStats calls', () => {
    recordResult('wild-cards', true)
    recordResult('wild-cards', false)
    expect(loadStats('wild-cards')).toEqual({ wins: 1, losses: 1, currentStreak: 0, bestStreak: 1 })
  })
})

describe('winPercentage', () => {
  it('is 0 with no games played', () => {
    expect(winPercentage({ wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 })).toBe(0)
  })

  it('rounds to the nearest whole percent', () => {
    expect(winPercentage({ wins: 1, losses: 2, currentStreak: 0, bestStreak: 1 })).toBe(33)
  })
})
