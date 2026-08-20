import type { Card, Color } from '../engine/types'
import { CardView } from './CardView'
import styles from './DiscardPile.module.css'

const COLOR_VAR: Record<Color, string> = {
  red: 'var(--uno-red)',
  yellow: 'var(--uno-yellow)',
  green: 'var(--uno-green)',
  blue: 'var(--uno-blue)',
}

interface DiscardPileProps {
  /** The whole pile — the cards beneath the top one show through as a stack. */
  pile: Card[]
  activeColor: Color
  /** Hidden while the played card is still animating in from a player's seat. */
  hideTop?: boolean
  pileRef?: React.Ref<HTMLDivElement>
}

export function DiscardPile({ pile, activeColor, hideTop, pileRef }: DiscardPileProps) {
  const topCard = pile[pile.length - 1]
  const under1 = pile[pile.length - 2]
  const under2 = pile[pile.length - 3]
  const isWild = topCard.value === 'wild' || topCard.value === 'wild-draw4'

  return (
    <div className={styles.wrap} ref={pileRef}>
      {/* The active colour pools on the felt beneath the pile. */}
      <div className={styles.glow} style={{ background: COLOR_VAR[activeColor] }} />
      {under2 && <CardView card={under2} size="md" className={styles.under2} />}
      {under1 && <CardView card={under1} size="md" className={styles.under1} />}
      <CardView
        key={topCard.id}
        card={topCard}
        size="md"
        className={`${styles.top} ${hideTop ? styles.hidden : ''}`}
      />
      {isWild && !hideTop && (
        <span
          className={styles.colorDot}
          style={{ background: COLOR_VAR[activeColor] }}
          aria-label={`Active colour: ${activeColor}`}
        />
      )}
    </div>
  )
}
