import { useEffect, useState } from 'react'
import type { Card } from '../engine/types'
import { CardView } from './CardView'
import styles from './FlyingCard.module.css'

export interface Point {
  x: number
  y: number
}

interface FlyingCardProps {
  card: Card
  from: Point
  to: Point
  onDone: () => void
}

/**
 * Carries a just-played card from its owner's seat to the discard pile.
 * Both points are viewport coordinates measured at the moment of the play,
 * so this renders fixed-position and simply transitions between them.
 */
export function FlyingCard({ card, from, to, onDone }: FlyingCardProps) {
  const [moved, setMoved] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMoved(true))
    // Fallback in case the transition never fires (e.g. reduced-motion).
    const timer = setTimeout(onDone, 700)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [onDone])

  const dx = to.x - from.x
  const dy = to.y - from.y

  return (
    <div
      className={styles.flyer}
      style={{
        left: `${from.x}px`,
        top: `${from.y}px`,
        transform: moved
          ? `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(0deg) scale(1)`
          : 'translate(-50%, -50%) rotate(-12deg) scale(0.82)',
      }}
      onTransitionEnd={onDone}
      aria-hidden="true"
    >
      <CardView card={card} size="md" />
    </div>
  )
}
