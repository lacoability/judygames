import type { Player } from '../engine/types'
import { CardView } from './CardView'
import styles from './OpponentHandBadge.module.css'

const BACK_CARD = { id: 'back', color: null, value: '0' } as const
const MAX_BACKS = 3

interface OpponentHandBadgeProps {
  player: Player
  isTurn: boolean
  /** Up after the current player — makes the direction of play concrete. */
  isNext?: boolean
  canChallenge: boolean
  onChallenge: () => void
}

export function OpponentHandBadge({ player, isTurn, isNext, canChallenge, onChallenge }: OpponentHandBadgeProps) {
  const backs = Math.min(player.hand.length, MAX_BACKS)
  const mid = (backs - 1) / 2

  return (
    <div className={`${styles.seat} ${isTurn ? styles.seatActive : ''}`}>
      <div className={styles.miniFan}>
        {Array.from({ length: backs }, (_, i) => (
          <CardView
            key={i}
            card={BACK_CARD}
            size="sm"
            faceDown
            className={styles.back}
            style={{
              transform: `rotate(${(i - mid) * 12}deg) translateY(${Math.abs(i - mid) * 3}px)`,
              zIndex: i,
            }}
          />
        ))}
      </div>

      <div className={styles.nameRow}>
        <span className={styles.name}>{player.name}</span>
        <span className={styles.count}>{player.hand.length}</span>
      </div>

      {isNext && <span className={styles.nextTag}>next</span>}

      {player.calledUno && <span className={styles.unoFlag}>UNO</span>}

      {canChallenge && (
        <button type="button" className={styles.catchButton} onClick={onChallenge}>
          Catch!
        </button>
      )}
    </div>
  )
}
