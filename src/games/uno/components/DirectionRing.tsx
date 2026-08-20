import styles from './DirectionRing.module.css'

const CX = 160
const CY = 100
const RX = 146
const RY = 88

// Arrowheads sit at the right, bottom, left and top of the ring.
const ANGLES = [0, 90, 180, 270]

interface Arrow {
  x: number
  y: number
  rotation: number
}

function arrowsFor(direction: 1 | -1): Arrow[] {
  return ANGLES.map((deg) => {
    const t = (deg * Math.PI) / 180
    // Tangent of the ellipse at t, which is the clockwise travel direction
    // in SVG's y-down space; flipped 180° when play has been reversed.
    const angle = (Math.atan2(RY * Math.cos(t), -RX * Math.sin(t)) * 180) / Math.PI
    return {
      x: CX + RX * Math.cos(t),
      y: CY + RY * Math.sin(t),
      rotation: direction === 1 ? angle : angle + 180,
    }
  })
}

interface DirectionRingProps {
  direction: 1 | -1
}

/**
 * Shows which way play is flowing around the table. Seats are arranged
 * clockwise from the player, so a clockwise ring means "the person to my
 * left goes next" — the thing that gets confusing after a reverse.
 */
export function DirectionRing({ direction }: DirectionRingProps) {
  return (
    <svg
      className={styles.ring}
      viewBox={`0 0 ${CX * 2} ${CY * 2}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <ellipse
        className={`${styles.track} ${direction === 1 ? styles.clockwise : styles.counter}`}
        cx={CX}
        cy={CY}
        rx={RX}
        ry={RY}
      />
      {arrowsFor(direction).map((arrow, i) => (
        <polygon
          key={i}
          className={styles.arrow}
          points="-5,-4.5 6,0 -5,4.5"
          transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.rotation})`}
        />
      ))}
    </svg>
  )
}
