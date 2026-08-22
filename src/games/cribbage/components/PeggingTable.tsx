import type { PeggingEntry } from '../engine/types'
import { PlayingCardView } from './PlayingCardView'
import styles from './PeggingTable.module.css'

interface PeggingTableProps {
  sequence: PeggingEntry[]
  count: number
  humanMustGo: boolean
  onGo: () => void
}

export function PeggingTable({ sequence, count, humanMustGo, onGo }: PeggingTableProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {sequence.map((entry, i) => (
          <PlayingCardView key={entry.card.id} card={entry.card} size="sm" style={{ zIndex: i }} />
        ))}
      </div>
      <div className={styles.count}>{count}</div>
      {humanMustGo && (
        <button type="button" className={styles.goButton} onClick={onGo}>
          Go
        </button>
      )}
    </div>
  )
}
