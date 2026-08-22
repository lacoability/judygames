import { Link } from 'react-router-dom'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { winPercentage, type GameStats } from '../../../shared/utils/stats'
import styles from './WinModal.module.css'

interface WinModalProps {
  open: boolean
  winnerName: string | null
  playerWon: boolean
  winnerScore: number
  loserScore: number
  stats: GameStats
  onPlayAgain: () => void
}

function skunkLabel(loserScore: number): string | null {
  if (loserScore < 61) return 'Double skunk!'
  if (loserScore < 91) return 'Skunk!'
  return null
}

export function WinModal({ open, winnerName, playerWon, winnerScore, loserScore, stats, onPlayAgain }: WinModalProps) {
  const skunk = skunkLabel(loserScore)

  return (
    <Modal open={open}>
      <div className={styles.crest}>{playerWon ? '🏆' : '🤖'}</div>
      <h2 className={styles.title}>{playerWon ? 'You win!' : `${winnerName} wins`}</h2>
      <p className={styles.subtitle}>
        {winnerScore}&ndash;{loserScore}
        {skunk ? ` — ${skunk}` : ''}
      </p>

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{stats.currentStreak}</div>
          <div className={styles.statLabel}>Win streak</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{winPercentage(stats)}%</div>
          <div className={styles.statLabel}>Win rate</div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onPlayAgain}>Play Again</Button>
        <Link to="/" className={styles.backLink}>
          Back to Game Hub
        </Link>
      </div>
    </Modal>
  )
}
