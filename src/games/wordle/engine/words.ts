import validWordsRaw from '../data/valid-words.csv?raw'
import wordBankRaw from '../data/word-bank.csv?raw'
import { createSeededRng } from '../../../shared/utils/random'

function parseWordList(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

// word-bank.csv is alphabetical, which would make early puzzles trivially
// guessable and the whole sequence predictable ahead of time. Shuffling
// once with a fixed seed gives a stable puzzle order instead — puzzle #412
// is always the same word, on every device, forever, since this is a pure
// function of the seed and the (fixed) file contents.
const PUZZLE_ORDER_SEED = 20240101

function shuffle(words: string[], seed: number): string[] {
  const rng = createSeededRng(seed)
  const result = [...words]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Puzzle order is fixed by the seed above — index 0 is always the same word. */
export const ANSWERS: readonly string[] = shuffle(parseWordList(wordBankRaw), PUZZLE_ORDER_SEED)
export const TOTAL_PUZZLES = ANSWERS.length

// valid-words.csv is a superset of word-bank.csv, so this one set covers
// every legal guess, including every possible answer.
const VALID_GUESSES = new Set(parseWordList(validWordsRaw))

export function isValidGuess(word: string): boolean {
  return VALID_GUESSES.has(word.toLowerCase())
}

export function getAnswer(puzzleIndex: number): string {
  return ANSWERS[puzzleIndex]
}

export function clampPuzzleIndex(index: number): number {
  return Math.max(0, Math.min(TOTAL_PUZZLES - 1, index))
}
