import type { LetterStatus } from '../engine/evaluate'
import styles from './Tile.module.css'

interface TileProps {
  letter: string
  status?: LetterStatus
  /** Staggers the flip so a row reveals left-to-right instead of all at once. */
  revealDelayMs?: number
}

export function Tile({ letter, status, revealDelayMs = 0 }: TileProps) {
  const classes = [styles.tile, status ? styles[status] : letter ? styles.filled : ''].filter(Boolean).join(' ')
  return (
    <div className={classes} style={status ? { animationDelay: `${revealDelayMs}ms` } : undefined}>
      {letter}
    </div>
  )
}
