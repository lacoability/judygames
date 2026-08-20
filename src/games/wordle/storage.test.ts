import { beforeEach, describe, expect, it } from 'vitest'
import { computeStats, loadAttempt, loadLastPuzzleIndex, saveAttempt, saveLastPuzzleIndex, loadAttempts } from './storage'

// vitest's default 'node' environment has no localStorage — a minimal
// in-memory stand-in is enough to exercise the persistence paths.
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

describe('saveAttempt / loadAttempt', () => {
  it('round-trips a finished attempt', () => {
    saveAttempt(41, { guesses: ['stare', 'crane'], status: 'won' })
    expect(loadAttempt(41)).toEqual({ guesses: ['stare', 'crane'], status: 'won' })
  })

  it('returns null for a puzzle never attempted', () => {
    expect(loadAttempt(999)).toBeNull()
  })

  it('does not persist a pristine, untouched puzzle', () => {
    saveAttempt(5, { guesses: [], status: 'in-progress' })
    expect(loadAttempt(5)).toBeNull()
    expect(loadAttempts()).toEqual({})
  })

  it('does persist a partial in-progress attempt', () => {
    saveAttempt(5, { guesses: ['stare'], status: 'in-progress' })
    expect(loadAttempt(5)).toEqual({ guesses: ['stare'], status: 'in-progress' })
  })

  it('keeps separate puzzles independent', () => {
    saveAttempt(1, { guesses: ['crane'], status: 'won' })
    saveAttempt(2, { guesses: ['trace', 'stare'], status: 'lost' })
    expect(loadAttempt(1)?.guesses).toEqual(['crane'])
    expect(loadAttempt(2)?.guesses).toEqual(['trace', 'stare'])
  })
})

describe('last puzzle index', () => {
  it('is null until something is saved', () => {
    expect(loadLastPuzzleIndex()).toBeNull()
  })

  it('round-trips', () => {
    saveLastPuzzleIndex(1200)
    expect(loadLastPuzzleIndex()).toBe(1200)
  })
})

describe('computeStats', () => {
  it('is all zero with nothing played', () => {
    expect(computeStats({})).toEqual({ played: 0, won: 0, lost: 0, winPercent: 0, distribution: [0, 0, 0, 0, 0, 0] })
  })

  it('bins wins into the distribution by guess count, and counts losses separately', () => {
    const attempts = {
      0: { guesses: ['crane'], status: 'won' as const }, // 1 guess
      1: { guesses: ['a', 'b', 'c'], status: 'won' as const }, // 3 guesses
      2: { guesses: ['a', 'b', 'c'], status: 'won' as const }, // 3 guesses
      3: { guesses: ['a', 'b', 'c', 'd', 'e', 'f'], status: 'lost' as const },
      4: { guesses: ['x'], status: 'in-progress' as const }, // not finished — excluded
    }
    const stats = computeStats(attempts)
    expect(stats.played).toBe(4)
    expect(stats.won).toBe(3)
    expect(stats.lost).toBe(1)
    expect(stats.winPercent).toBe(75)
    expect(stats.distribution).toEqual([1, 0, 2, 0, 0, 0])
  })
})
