import { describe, expect, it } from 'vitest'
import { evaluateGuess, keyboardStatuses } from './evaluate'

describe('evaluateGuess', () => {
  it('marks an exact match all correct', () => {
    expect(evaluateGuess('crane', 'crane')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct'])
  })

  it('marks letters absent when they never appear in the answer', () => {
    // "smoky" and "crane" share no letters at all.
    expect(evaluateGuess('smoky', 'crane')).toEqual(['absent', 'absent', 'absent', 'absent', 'absent'])
  })

  it('marks a right letter in the wrong position as present', () => {
    // 'e' is in "crane" but not at index 0
    expect(evaluateGuess('extra', 'crane')[0]).toBe('present')
  })

  it('does not double-count a duplicate guessed letter beyond what the answer has', () => {
    // answer "crane" has exactly one 'e', already claimed correct at index 4,
    // so neither of guess "eerie"'s other e's (indices 0, 1) can register.
    const statuses = evaluateGuess('eerie', 'crane')
    expect(statuses).toEqual(['absent', 'absent', 'present', 'absent', 'correct'])
  })

  it('caps extra duplicate guesses once the answer\'s letter pool for them is used up', () => {
    // answer "sassy" has three s's (indices 0, 2, 3). Guessing "assss" claims
    // indices 2 and 3 as correct-position matches, leaving one spare s in the
    // pool for the guess's remaining s's (indices 1 and 4) to compete over —
    // index 1 gets it, index 4 (checked last) finds the pool empty.
    const statuses = evaluateGuess('assss', 'sassy')
    expect(statuses).toEqual(['present', 'present', 'correct', 'correct', 'absent'])
  })
})

describe('keyboardStatuses', () => {
  it('reflects the best status seen for each letter across all guesses', () => {
    // "crane" vs answer "spelt" shares no letters, so 'c' should read absent.
    const statuses = keyboardStatuses(['crane', 'spelt'], 'spelt')
    expect(statuses['c']).toBe('absent')
  })

  it('upgrades a letter from present to correct once a later guess proves it', () => {
    // answer "route": guess1 "outer" has 'o' at index 0 (present, since the
    // answer's 'o' is at index 1). guess2 "route" nails 'o' at index 1 (correct).
    const statuses = keyboardStatuses(['outer', 'route'], 'route')
    expect(statuses['o']).toBe('correct')
  })
})
