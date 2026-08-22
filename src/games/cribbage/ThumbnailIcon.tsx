import { PlayingCardView } from './components/PlayingCardView'
import type { Card } from './engine/types'

const PREVIEW: Card[] = [
  { id: 'thumb-5', rank: '5', suit: 'hearts' },
  { id: 'thumb-j', rank: 'J', suit: 'spades' },
  { id: 'thumb-a', rank: 'A', suit: 'diamonds' },
]

export function ThumbnailIcon() {
  return (
    <div style={{ position: 'relative', width: 80, height: 68 }}>
      {PREVIEW.map((card, i) => (
        <PlayingCardView
          key={card.id}
          card={card}
          size="sm"
          style={{
            position: 'absolute',
            left: 19,
            bottom: 0,
            transformOrigin: '50% 100%',
            transform: `rotate(${(i - 1) * 15}deg) translateY(${Math.abs(i - 1) * 2}px)`,
            zIndex: i,
          }}
        />
      ))}
    </div>
  )
}
