import type { Card } from '../engine/types'
import { PlayingCardView } from './PlayingCardView'
import styles from './CribPile.module.css'

interface CribPileProps {
  cards: Card[]
  revealed: boolean
  /** Fully-formed label, e.g. "Your crib" or "Nibs's crib" — grammar varies by whose it is. */
  label: string
}

export function CribPile({ cards, revealed, label }: CribPileProps) {
  if (cards.length === 0) return null
  return (
    <div className={styles.wrap}>
      <div className={styles.stack}>
        {cards.map((card, i) => (
          <PlayingCardView
            key={card.id}
            card={card}
            size="sm"
            faceDown={!revealed}
            className={styles.card}
            style={{ left: `${i * 8}px`, zIndex: i }}
          />
        ))}
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  )
}
