import { useLayoutEffect, useRef, useState } from 'react'
import type { Card } from '../engine/types'
import { PlayingCardView } from './PlayingCardView'
import styles from './Hand.module.css'

const CARD_W = 88
const CARD_H = 128
const MAX_HALF_SPREAD = 11
const EDGE_PAD = Math.ceil(CARD_H * Math.sin((MAX_HALF_SPREAD * Math.PI) / 180)) + 8
const MAX_GAP = 10
const MAX_STEP_ANGLE = 4
const ARC_DROP = 10
const READY_LIFT = 10
/** A card staged for the crib stands well proud of the rest of the fan. */
const SELECTED_LIFT = 24

interface HandProps {
  hand: Card[]
  /** Cards the human may currently tap — selectable during discard, playable during pegging. */
  enabledIds: Set<string>
  selectedIds?: Set<string>
  onCardClick?: (card: Card) => void
}

export function Hand({ hand, enabledIds, selectedIds, onCardClick }: HandProps) {
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
  // One assumed width until the track is measured — centring off the raw 0
  // would lay the first paint out from a negative origin and clip the fan.
  const trackW = width || 360
  const available = Math.max(trackW - EDGE_PAD * 2, CARD_W)
  const step = n > 1 ? Math.min(CARD_W + MAX_GAP, (available - CARD_W) / (n - 1)) : 0
  const totalW = CARD_W + step * (n - 1)
  const startX = (trackW - totalW) / 2
  const stepAngle = n > 1 ? Math.min(MAX_STEP_ANGLE, (MAX_HALF_SPREAD * 2) / (n - 1)) : 0
  const mid = (n - 1) / 2

  return (
    <div className={styles.track} ref={trackRef}>
      {hand.map((card, i) => {
        const enabled = enabledIds.has(card.id)
        // Undefined outside select mode, so pegging cards aren't exposed as toggles.
        const selected = selectedIds ? selectedIds.has(card.id) : undefined

        const offset = i - mid
        const angle = offset * stepAngle
        const ratio = mid === 0 ? 0 : offset / mid
        // A picked card rides clear of the fan. The lift has to live here rather
        // than in CSS — this inline transform would override a stylesheet one.
        const lift = selected ? SELECTED_LIFT : enabled ? READY_LIFT : 0
        const drop = ratio * ratio * ARC_DROP - lift

        return (
          <PlayingCardView
            key={card.id}
            card={card}
            size="xl"
            disabled={!enabled}
            selected={selected}
            className={styles.card}
            style={{
              left: `${startX + i * step}px`,
              // Lifted cards clear the whole fan, so a neighbour later in the
              // stacking order can't cut across the card you just picked.
              zIndex: selected ? 50 + i : i,
              transform: `translateY(${drop}px) rotate(${angle}deg)`,
            }}
            onClick={enabled && onCardClick ? () => onCardClick(card) : undefined}
          />
        )
      })}
    </div>
  )
}
