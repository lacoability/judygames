import styles from './DrawCallout.module.css'

interface DrawCalloutProps {
  /** Set when a +2/+4 stack is forcing the draw, so we can name the cost. */
  pendingDraw: number
}

export function DrawCallout({ pendingDraw }: DrawCalloutProps) {
  return (
    <div className={styles.callout} role="status">
      <div className={styles.word}>DRAW</div>
      <div className={styles.hint}>
        {pendingDraw > 0 ? `Tap the deck to take ${pendingDraw}` : 'No cards to play — tap the deck'}
      </div>
    </div>
  )
}
