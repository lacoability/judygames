import { evaluateGuess, type LetterStatus } from './engine/evaluate'
import { MAX_GUESSES, WORD_LENGTH, type PuzzleStatus } from './engine/reducer'

const EMOJI: Record<LetterStatus, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
}

const BLANK_ROW = '⬜'.repeat(WORD_LENGTH)

export function buildShareText(puzzleNumber: number, guesses: string[], answer: string, status: PuzzleStatus): string {
  const rows = guesses.map((guess) =>
    evaluateGuess(guess, answer)
      .map((letterStatus) => EMOJI[letterStatus])
      .join(''),
  )
  // Won puzzles finish early — pad out to MAX_GUESSES rows so the grid always shows all 6.
  while (rows.length < MAX_GUESSES) rows.push(BLANK_ROW)

  const grid = rows.join('\n')
  const score = status === 'won' ? String(guesses.length) : 'X'

  // Guess count sits below the grid, so the emoji block leads when pasted.
  return `Word #${puzzleNumber}\n\n${grid}\n\nGuesses: ${score}/${MAX_GUESSES}`
}

/** navigator.clipboard requires a secure context; falls back to the old execCommand trick otherwise. */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // fall through to legacy path
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let succeeded = false
  try {
    succeeded = document.execCommand('copy')
  } catch {
    succeeded = false
  }
  document.body.removeChild(textarea)
  return succeeded
}
