export interface GameStats {
  wins: number
  losses: number
  currentStreak: number
  bestStreak: number
}

const EMPTY_STATS: GameStats = { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 }

function storageKey(gameId: string): string {
  return `game-hub:stats:${gameId}`
}

export function loadStats(gameId: string): GameStats {
  try {
    const raw = localStorage.getItem(storageKey(gameId))
    if (!raw) return { ...EMPTY_STATS }
    // Spread over EMPTY_STATS so a future field added to GameStats still has
    // a sane default against older saved data.
    return { ...EMPTY_STATS, ...JSON.parse(raw) }
  } catch {
    // Private browsing, storage disabled, or corrupt JSON — stats just won't persist.
    return { ...EMPTY_STATS }
  }
}

export function recordResult(gameId: string, won: boolean): GameStats {
  const current = loadStats(gameId)
  const next: GameStats = won
    ? {
        ...current,
        wins: current.wins + 1,
        currentStreak: current.currentStreak + 1,
        bestStreak: Math.max(current.bestStreak, current.currentStreak + 1),
      }
    : { ...current, losses: current.losses + 1, currentStreak: 0 }

  try {
    localStorage.setItem(storageKey(gameId), JSON.stringify(next))
  } catch {
    // Nothing to do if storage isn't available — the in-memory value still updates.
  }
  return next
}

export function winPercentage(stats: GameStats): number {
  const total = stats.wins + stats.losses
  return total === 0 ? 0 : Math.round((stats.wins / total) * 100)
}
