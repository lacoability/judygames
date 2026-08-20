import { Link } from 'react-router-dom'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import { winPercentage, type GameStats } from '../../../shared/utils/stats'
import styles from './WinModal.module.css'

interface WinModalProps {
  open: boolean
  winnerName: string | null
  playerWon: boolean
  stats: GameStats
  onPlayAgain: () => void
}

export function WinModal({ open, winnerName, playerWon, stats, onPlayAgain }: WinModalProps) {
  return (
    <Modal open={open}>
      <div className={styles.crest}>{playerWon ? '🏆' : '🤖'}</div>
      <h2 className={styles.title}>{playerWon ? 'You win!' : `${winnerName} wins`}</h2>
      <p className={styles.subtitle}>
        {playerWon
          ? stats.currentStreak > 1
            ? `Cleared the hand — ${stats.currentStreak} in a row.`
            : 'Cleared the whole hand.'
          : 'Better luck next round.'}
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
          Back to Card Hub
        </Link>
      </div>
    </Modal>
  )
}
