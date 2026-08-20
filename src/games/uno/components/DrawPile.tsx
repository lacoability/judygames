import { CardView } from './CardView'
import styles from './DrawPile.module.css'

const BACK_CARD = { id: 'draw-back', color: null, value: '0' } as const

interface DrawPileProps {
  count: number
  disabled?: boolean
  pendingDraw?: number
  onDraw: () => void
}

export function DrawPile({ count, disabled, pendingDraw = 0, onDraw }: DrawPileProps) {
  return (
    <button
      type="button"
      className={`${styles.wrap} ${!disabled ? styles.ready : ''}`}
      onClick={onDraw}
      disabled={disabled}
      aria-label={pendingDraw > 0 ? `Draw ${pendingDraw} cards` : 'Draw a card'}
    >
      <CardView card={BACK_CARD} size="md" faceDown className={styles.under2} />
      <CardView card={BACK_CARD} size="md" faceDown className={styles.under1} />
      <CardView card={BACK_CARD} size="md" faceDown className={styles.top} />
      <span className={styles.count}>{count}</span>
      {pendingDraw > 0 && <span className={styles.penalty}>+{pendingDraw}</span>}
    </button>
  )
}
