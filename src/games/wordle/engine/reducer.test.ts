import { describe, expect, it } from 'vitest'
import { initPuzzleState, wordleReducer } from './reducer'

describe('typing and backspace', () => {
  it('builds up the current guess letter by letter', () => {
    let state = initPuzzleState(0, 'crane')
    state = wordleReducer(state, { type: 'TYPE_LETTER', letter: 'c' })
    state = wordleReducer(state, { type: 'TYPE_LETTER', letter: 'R' }) // uppercase input still lowercases
    expect(state.currentGuess).toBe('cr')
  })

  it('ignores extra letters once the row is full', () => {
    let state = initPuzzleState(0, 'crane')
    for (const letter of 'crane') state = wordleReducer(state, { type: 'TYPE_LETTER', letter })
    const overflowed = wordleReducer(state, { type: 'TYPE_LETTER', letter: 'x' })
    expect(overflowed.currentGuess).toBe('crane')
  })

  it('backspaces one letter at a time and no further once empty', () => {
    let state = initPuzzleState(0, 'crane')
    state = wordleReducer(state, { type: 'TYPE_LETTER', letter: 'c' })
    state = wordleReducer(state, { type: 'BACKSPACE' })
    expect(state.currentGuess).toBe('')
    state = wordleReducer(state, { type: 'BACKSPACE' })
    expect(state.currentGuess).toBe('')
  })
})

describe('submitting a guess', () => {
  it('rejects a guess that is too short and bumps invalidPulse instead of consuming a row', () => {
    let state = initPuzzleState(0, 'crane')
    state = wordleReducer(state, { type: 'TYPE_LETTER', letter: 'c' })
    state = wordleReducer(state, { type: 'SUBMIT_GUESS' })
    expect(state.guesses).toHaveLength(0)
    expect(state.invalidPulse).toBe(1)
  })

  it('rejects a full-length guess that is not a real word', () => {
    let state = initPuzzleState(0, 'crane')
    for (const letter of 'zzzzz') state = wordleReducer(state, { type: 'TYPE_LETTER', letter })
    state = wordleReducer(state, { type: 'SUBMIT_GUESS' })
    expect(state.guesses).toHaveLength(0)
    expect(state.invalidPulse).toBe(1)
    expect(state.status).toBe('in-progress')
  })

  it('accepts a valid guess, appends it, and clears the current row', () => {
    let state = initPuzzleState(0, 'crane')
    for (const letter of 'stare') state = wordleReducer(state, { type: 'TYPE_LETTER', letter })
    state = wordleReducer(state, { type: 'SUBMIT_GUESS' })
    expect(state.guesses).toEqual(['stare'])
    expect(state.currentGuess).toBe('')
    expect(state.status).toBe('in-progress')
  })

  it('wins the moment the guess matches the answer', () => {
    let state = initPuzzleState(0, 'crane')
    for (const letter of 'crane') state = wordleReducer(state, { type: 'TYPE_LETTER', letter })
    state = wordleReducer(state, { type: 'SUBMIT_GUESS' })
    expect(state.status).toBe('won')
    expect(state.guesses).toEqual(['crane'])
  })

  it('loses after the sixth non-matching guess', () => {
    let state = initPuzzleState(0, 'crane')
    const wrongGuesses = ['stare', 'ratio', 'store', 'trace', 'tears', 'rates']
    for (const guess of wrongGuesses) {
      for (const letter of guess) state = wordleReducer(state, { type: 'TYPE_LETTER', letter })
      state = wordleReducer(state, { type: 'SUBMIT_GUESS' })
    }
    expect(state.guesses).toHaveLength(6)
    expect(state.status).toBe('lost')
  })

  it('ignores further actions once the puzzle is finished', () => {
    let state = initPuzzleState(0, 'crane')
    for (const letter of 'crane') state = wordleReducer(state, { type: 'TYPE_LETTER', letter })
    state = wordleReducer(state, { type: 'SUBMIT_GUESS' })
    const after = wordleReducer(state, { type: 'TYPE_LETTER', letter: 'x' })
    expect(after).toBe(state)
  })
})

describe('initPuzzleState', () => {
  it('restores prior guesses and status for a puzzle already in progress', () => {
    const state = initPuzzleState(3, 'crane', { guesses: ['stare', 'trace'], status: 'in-progress' })
    expect(state.guesses).toEqual(['stare', 'trace'])
    expect(state.status).toBe('in-progress')
    expect(state.currentGuess).toBe('')
  })
})
