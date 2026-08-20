import { Modal } from '../../../shared/components/Modal'
import modalStyles from '../../../shared/components/Modal.module.css'
import { StatsPanel } from './StatsPanel'
import type { WordleStats } from '../storage'
import styles from './StatsModal.module.css'

interface StatsModalProps {
  open: boolean
  stats: WordleStats
  totalPuzzles: number
  onClose: () => void
}

export function StatsModal({ open, stats, totalPuzzles, onClose }: StatsModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <h2 className={modalStyles.title}>Your stats</h2>
      <StatsPanel stats={stats} />
      <p className={styles.footer}>
        {stats.played} of {totalPuzzles} puzzles played
      </p>
    </Modal>
  )
}
