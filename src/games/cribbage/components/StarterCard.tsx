import type { Card } from '../engine/types'
import { PlayingCardView } from './PlayingCardView'
import styles from './StarterCard.module.css'

interface StarterCardProps {
  /** Cards left in the stock, drawn as a stack for the cut to sit on. */
  deckCount: number
  starter: Card | null
  heels: boolean
}

const BACK: Card = { id: 'deck-back', rank: 'A', suit: 'spades' }
/** Enough backs to read as a deck without drawing all forty. */
const VISIBLE_BACKS = 4

export function StarterCard({ deckCount, starter, heels }: StarterCardProps) {
  const backs = Math.min(deckCount, VISIBLE_BACKS)

  return (
    <div className={styles.wrap}>
      <div className={styles.stack}>
        {Array.from({ length: backs }, (_, i) => (
          <PlayingCardView
            key={i}
            card={BACK}
            size="lg"
            faceDown
            className={styles.back}
            style={{ left: `${i * 1.5}px`, top: `${-i * 1.5}px`, zIndex: i }}
          />
        ))}
        {/* The cut card is turned face up across the top of the deck. */}
        {starter && <PlayingCardView card={starter} size="lg" className={styles.starter} style={{ zIndex: VISIBLE_BACKS + 1 }} />}
      </div>
      {heels && <div className={styles.heels}>His Heels — +2</div>}
    </div>
  )
}
