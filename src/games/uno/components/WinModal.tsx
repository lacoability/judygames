import { Link } from 'react-router-dom'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import styles from './WinModal.module.css'

interface WinModalProps {
  open: boolean
  winnerName: string | null
  playerWon: boolean
  onPlayAgain: () => void
}

export function WinModal({ open, winnerName, playerWon, onPlayAgain }: WinModalProps) {
  return (
    <Modal open={open}>
      <div className={styles.crest}>{playerWon ? '🏆' : '🤖'}</div>
      <h2 className={styles.title}>{playerWon ? 'You win!' : `${winnerName} wins`}</h2>
      <p className={styles.subtitle}>{playerWon ? 'Cleared the whole hand.' : 'Better luck next round.'}</p>
      <div className={styles.actions}>
        <Button onClick={onPlayAgain}>Play Again</Button>
        <Link to="/" className={styles.backLink}>
          Back to Card Hub
        </Link>
      </div>
    </Modal>
  )
}
