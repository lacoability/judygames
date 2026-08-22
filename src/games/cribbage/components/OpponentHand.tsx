import type { Card } from '../engine/types'
import { PlayingCardView } from './PlayingCardView'
import styles from './OpponentHand.module.css'

interface OpponentHandProps {
  name: string
  count: number
  isTurn: boolean
  isDealer: boolean
  isStuck: boolean
}

const PLACEHOLDER: Card = { id: 'back', rank: 'A', suit: 'spades' }

export function OpponentHand({ name, count, isTurn, isDealer, isStuck }: OpponentHandProps) {
  return (
    <div className={`${styles.wrap} ${isTurn ? styles.active : ''}`}>
      <div className={styles.stack}>
        {Array.from({ length: count }, (_, i) => (
          <PlayingCardView
            key={i}
            card={PLACEHOLDER}
            size="sm"
            faceDown
            className={styles.card}
            style={{ left: `${i * 10}px`, zIndex: i }}
          />
        ))}
      </div>
      <div className={styles.label}>
        <span>{name}</span>
        {isDealer && <span className={styles.dealerBadge}>Dealer</span>}
        {isStuck && <span className={styles.goBadge}>Go</span>}
      </div>
    </div>
  )
}
