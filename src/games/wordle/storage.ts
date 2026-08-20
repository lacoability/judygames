import type { PuzzleStatus } from './engine/reducer'

export interface PuzzleAttempt {
  guesses: string[]
  status: PuzzleStatus
}

type AttemptsMap = Record<number, PuzzleAttempt>

const ATTEMPTS_KEY = 'game-hub:wordle:attempts'
const LAST_PUZZLE_KEY = 'game-hub:wordle:last-puzzle'

export function loadAttempts(): AttemptsMap {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function loadAttempt(puzzleIndex: number): PuzzleAttempt | null {
  return loadAttempts()[puzzleIndex] ?? null
}

/** No-ops for a pristine, untouched puzzle so merely browsing to it doesn't clutter storage. */
export function saveAttempt(puzzleIndex: number, attempt: PuzzleAttempt): void {
  if (attempt.guesses.length === 0 && attempt.status === 'in-progress') return
  const attempts = loadAttempts()
  attempts[puzzleIndex] = attempt
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts))
  } catch {
    // Storage unavailable (private browsing, quota) — the session still plays fine in memory.
  }
}

export function loadLastPuzzleIndex(): number | null {
  try {
    const raw = localStorage.getItem(LAST_PUZZLE_KEY)
    return raw === null ? null : Number(raw)
  } catch {
    return null
  }
}

export function saveLastPuzzleIndex(index: number): void {
  try {
    localStorage.setItem(LAST_PUZZLE_KEY, String(index))
  } catch {
    // Nothing to do — just won't resume on the same puzzle next visit.
  }
}

export interface WordleStats {
  played: number
  won: number
  lost: number
  winPercent: number
  /** Index i = count of puzzles solved in i+1 guesses. */
  distribution: number[]
}

/** "Completed" means solved — a used-up 6th guess without the answer counts as played, not completed. */
export function computeStats(attempts: AttemptsMap): WordleStats {
  const distribution = [0, 0, 0, 0, 0, 0]
  let won = 0
  let lost = 0

  for (const attempt of Object.values(attempts)) {
    if (attempt.status === 'won') {
      won += 1
      const guessCount = attempt.guesses.length
      if (guessCount >= 1 && guessCount <= 6) distribution[guessCount - 1] += 1
    } else if (attempt.status === 'lost') {
      lost += 1
    }
  }

  const played = won + lost
  return {
    played,
    won,
    lost,
    winPercent: played === 0 ? 0 : Math.round((won / played) * 100),
    distribution,
  }
}
