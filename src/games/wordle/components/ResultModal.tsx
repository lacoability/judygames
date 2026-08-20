import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import modalStyles from '../../../shared/components/Modal.module.css'
import { StatsPanel } from './StatsPanel'
import type { WordleStats } from '../storage'
import type { PuzzleStatus } from '../engine/reducer'
import styles from './ResultModal.module.css'

interface ResultModalProps {
  open: boolean
  status: PuzzleStatus
  answer: string
  guessCount: number
  stats: WordleStats
  hasNextPuzzle: boolean
  onNext: () => void
  onClose: () => void
}

export function ResultModal({ open, status, answer, guessCount, stats, hasNextPuzzle, onNext, onClose }: ResultModalProps) {
  const won = status === 'won'

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.crest}>{won ? '🎉' : '💀'}</div>
      <h2 className={modalStyles.title}>{won ? `Solved in ${guessCount}!` : 'So close!'}</h2>
      <p className={styles.answer}>
        The word was <strong>{answer.toUpperCase()}</strong>
      </p>

      <StatsPanel stats={stats} highlightGuessCount={won ? guessCount : undefined} />

      <div className={styles.actions}>
        {hasNextPuzzle && (
          <Button onClick={onNext}>Next Puzzle</Button>
        )}
        <Button variant="secondary" onClick={onClose}>
          Review Board
        </Button>
      </div>
    </Modal>
  )
}
