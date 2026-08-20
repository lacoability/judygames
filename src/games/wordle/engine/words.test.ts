import { describe, expect, it } from 'vitest'
import { ANSWERS, TOTAL_PUZZLES, clampPuzzleIndex, getAnswer, isValidGuess } from './words'

describe('ANSWERS', () => {
  it('has one entry per word-bank line', () => {
    expect(TOTAL_PUZZLES).toBe(2315)
    expect(ANSWERS).toHaveLength(2315)
  })

  it('is every 5-letter lowercase word, with no duplicates', () => {
    expect(new Set(ANSWERS).size).toBe(ANSWERS.length)
    for (const word of ANSWERS) {
      expect(word).toMatch(/^[a-z]{5}$/)
    }
  })

  it('is not the source file\'s alphabetical order (the whole point of shuffling it)', () => {
    const sorted = [...ANSWERS].sort()
    expect(ANSWERS).not.toEqual(sorted)
  })

  it('contains a known word-bank entry somewhere', () => {
    expect(ANSWERS).toContain('aback')
  })
})

describe('getAnswer / clampPuzzleIndex', () => {
  it('returns the answer at a given puzzle index', () => {
    expect(getAnswer(0)).toBe(ANSWERS[0])
    expect(getAnswer(TOTAL_PUZZLES - 1)).toBe(ANSWERS[TOTAL_PUZZLES - 1])
  })

  it('clamps out-of-range indices into bounds', () => {
    expect(clampPuzzleIndex(-5)).toBe(0)
    expect(clampPuzzleIndex(999999)).toBe(TOTAL_PUZZLES - 1)
    expect(clampPuzzleIndex(10)).toBe(10)
  })
})

describe('isValidGuess', () => {
  it('accepts words from the valid-guess list, case-insensitively', () => {
    expect(isValidGuess('aahed')).toBe(true)
    expect(isValidGuess('AAHED')).toBe(true)
  })

  it('accepts every possible answer as a valid guess', () => {
    // word-bank is a subset of valid-words, so every answer must itself be guessable.
    expect(ANSWERS.every((word) => isValidGuess(word))).toBe(true)
  })

  it('rejects gibberish', () => {
    expect(isValidGuess('zzzzz')).toBe(false)
    expect(isValidGuess('ab')).toBe(false)
  })
})
