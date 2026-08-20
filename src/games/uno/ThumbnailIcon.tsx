import { CardView } from './components/CardView'
import type { Card } from './engine/types'

// A little fan of real card faces — the hub preview uses the same renderer
// as the table, so the two always stay visually in sync.
const PREVIEW: Card[] = [
  { id: 'thumb-b', color: 'blue', value: '7' },
  { id: 'thumb-y', color: 'yellow', value: 'reverse' },
  { id: 'thumb-r', color: 'red', value: '5' },
]

export function ThumbnailIcon() {
  return (
    <div style={{ position: 'relative', width: 80, height: 68 }}>
      {PREVIEW.map((card, i) => (
        <CardView
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
