import { isValidGuess } from './words'

export const MAX_GUESSES = 6
export const WORD_LENGTH = 5

export type PuzzleStatus = 'in-progress' | 'won' | 'lost'

export interface WordleState {
  puzzleIndex: number
  answer: string
  guesses: string[]
  currentGuess: string
  status: PuzzleStatus
  /** Bumped on a rejected submission (wrong length / not a real word) — drives a shake animation. */
  invalidPulse: number
}

export function initPuzzleState(
  puzzleIndex: number,
  answer: string,
  restored?: { guesses: string[]; status: PuzzleStatus },
): WordleState {
  return {
    puzzleIndex,
    answer,
    guesses: restored?.guesses ?? [],
    currentGuess: '',
    status: restored?.status ?? 'in-progress',
    invalidPulse: 0,
  }
}

export type WordleAction = { type: 'TYPE_LETTER'; letter: string } | { type: 'BACKSPACE' } | { type: 'SUBMIT_GUESS' }

export function wordleReducer(state: WordleState, action: WordleAction): WordleState {
  if (state.status !== 'in-progress') return state

  switch (action.type) {
    case 'TYPE_LETTER': {
      if (state.currentGuess.length >= WORD_LENGTH || !/^[a-zA-Z]$/.test(action.letter)) return state
      return { ...state, currentGuess: state.currentGuess + action.letter.toLowerCase() }
    }

    case 'BACKSPACE': {
      if (state.currentGuess.length === 0) return state
      return { ...state, currentGuess: state.currentGuess.slice(0, -1) }
    }

    case 'SUBMIT_GUESS': {
      if (state.currentGuess.length !== WORD_LENGTH || !isValidGuess(state.currentGuess)) {
        return { ...state, invalidPulse: state.invalidPulse + 1 }
      }
      const guesses = [...state.guesses, state.currentGuess]
      const won = state.currentGuess === state.answer
      const status: PuzzleStatus = won ? 'won' : guesses.length >= MAX_GUESSES ? 'lost' : 'in-progress'
      return { ...state, guesses, currentGuess: '', status }
    }

    default:
      return state
  }
}
