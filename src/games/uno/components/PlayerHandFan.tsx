import { useLayoutEffect, useRef, useState } from 'react'
import type { Card } from '../engine/types'
import { CardView } from './CardView'
import styles from './PlayerHandFan.module.css'

const CARD_W = 88
const CARD_H = 128
// Rotating about the bottom edge swings a card's top corner outward by
// roughly CARD_H * sin(angle), so the track needs that much side room or the
// outermost cards clip against the screen edge.
const MAX_HALF_SPREAD = 13 // degrees from centre to outermost card
const EDGE_PAD = Math.ceil(CARD_H * Math.sin((MAX_HALF_SPREAD * Math.PI) / 180)) + 8
const MAX_GAP = 10
const MAX_STEP_ANGLE = 4.5
const ARC_DROP = 12 // px the outermost cards sag below the centre one
const READY_LIFT = 10 // px a playable card rises out of the fan

interface PlayerHandFanProps {
  hand: Card[]
  playableIds: Set<string>
  jumpInIds: Set<string>
  onPlay: (card: Card) => void
  onJumpIn: (card: Card) => void
}

export function PlayerHandFan({ hand, playableIds, jumpInIds, onPlay, onJumpIn }: PlayerHandFanProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    setWidth(el.getBoundingClientRect().width)
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const n = hand.length
  const available = Math.max((width || 360) - EDGE_PAD * 2, CARD_W)
  // Cards overlap only as much as they must to fit the track.
  const step = n > 1 ? Math.min(CARD_W + MAX_GAP, (available - CARD_W) / (n - 1)) : 0
  const totalW = CARD_W + step * (n - 1)
  const startX = (width - totalW) / 2
  const stepAngle = n > 1 ? Math.min(MAX_STEP_ANGLE, (MAX_HALF_SPREAD * 2) / (n - 1)) : 0
  const mid = (n - 1) / 2

  return (
    <div className={styles.track} ref={trackRef}>
      {hand.map((card, i) => {
        const playable = playableIds.has(card.id)
        const jumpable = !playable && jumpInIds.has(card.id)
        const enabled = playable || jumpable

        const offset = i - mid
        const angle = offset * stepAngle
        const ratio = mid === 0 ? 0 : offset / mid
        // Playable cards ride higher so they read as "ready" and are easier to tap.
        const drop = ratio * ratio * ARC_DROP - (enabled ? READY_LIFT : 0)

        return (
          <CardView
            key={card.id}
            card={card}
            size="xl"
            disabled={!enabled}
            className={`${styles.card} ${jumpable ? styles.jumpable : ''}`}
            style={{
              left: `${startX + i * step}px`,
              zIndex: i,
              transform: `translateY(${drop}px) rotate(${angle}deg)`,
            }}
            onClick={enabled ? () => (playable ? onPlay(card) : onJumpIn(card)) : undefined}
          />
        )
      })}
    </div>
  )
}
