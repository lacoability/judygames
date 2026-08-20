import { useCallback, useState } from 'react'
import { loadStats, recordResult, type GameStats } from '../utils/stats'

/** Persists win/loss/streak stats for one game (by its GameModule id) to localStorage. */
export function useGameStats(gameId: string) {
  const [stats, setStats] = useState<GameStats>(() => loadStats(gameId))

  const record = useCallback(
    (won: boolean) => {
      setStats(recordResult(gameId, won))
    },
    [gameId],
  )

  return { stats, record }
}
