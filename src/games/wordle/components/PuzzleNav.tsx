import { useState } from 'react'
import type { PuzzleStatus } from '../engine/reducer'
import styles from './PuzzleNav.module.css'

interface PuzzleNavProps {
  puzzleNumber: number
  totalPuzzles: number
  status: PuzzleStatus
  onNavigate: (puzzleIndex: number) => void
}

const STATUS_MARK: Record<PuzzleStatus, string | null> = {
  won: '✓',
  lost: '✕',
  'in-progress': null,
}

export function PuzzleNav({ puzzleNumber, totalPuzzles, status, onNavigate }: PuzzleNavProps) {
  const [jumpOpen, setJumpOpen] = useState(false)
  const [jumpValue, setJumpValue] = useState('')

  function submitJump() {
    const n = Number(jumpValue)
    if (Number.isFinite(n) && n >= 1) onNavigate(n - 1)
    setJumpOpen(false)
    setJumpValue('')
  }

  const mark = STATUS_MARK[status]

  return (
    <div className={styles.nav}>
      <button
        type="button"
        className={styles.arrow}
        disabled={puzzleNumber <= 1}
        onClick={() => onNavigate(puzzleNumber - 2)}
        aria-label="Previous puzzle"
      >
        ‹
      </button>

      {jumpOpen ? (
        <form
          className={styles.jumpForm}
          onSubmit={(e) => {
            e.preventDefault()
            submitJump()
          }}
        >
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={totalPuzzles}
            autoFocus
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onBlur={submitJump}
            className={styles.jumpInput}
            placeholder={`1-${totalPuzzles}`}
          />
        </form>
      ) : (
        <button type="button" className={styles.label} onClick={() => setJumpOpen(true)}>
          Word #{puzzleNumber}
          {mark && <span className={mark === '✓' ? styles.won : styles.lost}>{mark}</span>}
        </button>
      )}

      <button
        type="button"
        className={styles.arrow}
        disabled={puzzleNumber >= totalPuzzles}
        onClick={() => onNavigate(puzzleNumber)}
        aria-label="Next puzzle"
      >
        ›
      </button>
    </div>
  )
}
