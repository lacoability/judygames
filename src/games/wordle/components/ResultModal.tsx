import { useState } from 'react'
import { Modal } from '../../../shared/components/Modal'
import { Button } from '../../../shared/components/Button'
import modalStyles from '../../../shared/components/Modal.module.css'
import { StatsPanel } from './StatsPanel'
import type { WordleStats } from '../storage'
import type { PuzzleStatus } from '../engine/reducer'
import { buildShareText, copyToClipboard } from '../share'
import styles from './ResultModal.module.css'

interface ResultModalProps {
  open: boolean
  status: PuzzleStatus
  puzzleNumber: number
  guesses: string[]
  answer: string
  stats: WordleStats
  hasNextPuzzle: boolean
  onNext: () => void
  onClose: () => void
}

export function ResultModal({
  open,
  status,
  puzzleNumber,
  guesses,
  answer,
  stats,
  hasNextPuzzle,
  onNext,
  onClose,
}: ResultModalProps) {
  const won = status === 'won'
  const guessCount = guesses.length
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const text = buildShareText(puzzleNumber, guesses, answer, status)
    const succeeded = await copyToClipboard(text)
    if (succeeded) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className={styles.crest}>{won ? '🎉' : '💀'}</div>
      <h2 className={modalStyles.title}>{won ? `Solved in ${guessCount}!` : 'So close!'}</h2>
      <p className={styles.answer}>
        The word was <strong>{answer.toUpperCase()}</strong>
      </p>

      <StatsPanel stats={stats} highlightGuessCount={won ? guessCount : undefined} />

      <div className={styles.actions}>
        <Button variant="secondary" onClick={handleShare}>
          {copied ? 'Copied!' : 'Share Result'}
        </Button>
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
