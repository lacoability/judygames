export type LetterStatus = 'correct' | 'present' | 'absent'

/**
 * Classic two-pass Wordle scoring: correct positions are claimed first, then
 * remaining letters are matched against what's left of the answer's letter
 * pool. The pool accounting is what makes duplicate letters behave right —
 * e.g. guessing "SPEED" against answer "ERASE" doesn't mark both Es
 * present when the answer only has one leftover.
 */
export function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const g = guess.toLowerCase().split('')
  const a = answer.toLowerCase().split('')
  const statuses: LetterStatus[] = new Array(g.length).fill('absent')
  const remaining: Record<string, number> = {}

  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) {
      statuses[i] = 'correct'
    } else {
      remaining[a[i]] = (remaining[a[i]] ?? 0) + 1
    }
  }

  for (let i = 0; i < g.length; i++) {
    if (statuses[i] === 'correct') continue
    const letter = g[i]
    if (remaining[letter] > 0) {
      statuses[i] = 'present'
      remaining[letter] -= 1
    }
  }

  return statuses
}

const STATUS_RANK: Record<LetterStatus, number> = { absent: 0, present: 1, correct: 2 }

/** Best-known status per letter across every guess so far — drives keyboard colouring. */
export function keyboardStatuses(guesses: string[], answer: string): Record<string, LetterStatus> {
  const best: Record<string, LetterStatus> = {}
  for (const guess of guesses) {
    const statuses = evaluateGuess(guess, answer)
    guess
      .toLowerCase()
      .split('')
      .forEach((letter, i) => {
        const status = statuses[i]
        if (!best[letter] || STATUS_RANK[status] > STATUS_RANK[best[letter]]) {
          best[letter] = status
        }
      })
  }
  return best
}
