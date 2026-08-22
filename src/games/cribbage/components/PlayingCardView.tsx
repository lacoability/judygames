import type { CSSProperties } from 'react'
import type { Card, Suit } from '../engine/types'
import styles from './PlayingCardView.module.css'

const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const RED_SUITS: Suit[] = ['hearts', 'diamonds']

interface PlayingCardViewProps {
  card: Card
  size?: 'sm' | 'md' | 'lg' | 'xl'
  faceDown?: boolean
  disabled?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
  style?: CSSProperties
}

export function PlayingCardView({
  card,
  size = 'md',
  faceDown,
  disabled,
  selected,
  onClick,
  className,
  style,
}: PlayingCardViewProps) {
  const classes = [
    styles.card,
    styles[size],
    faceDown ? styles.faceDown : '',
    disabled ? styles.dimmed : '',
    selected ? styles.selected : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (faceDown) {
    return (
      <div className={classes} style={style} aria-hidden="true">
        <div className={styles.backPanel}>
          <div className={styles.backDiamond} />
        </div>
      </div>
    )
  }

  const isRed = RED_SUITS.includes(card.suit)
  const glyph = SUIT_GLYPH[card.suit]
  const label = `${card.rank} of ${card.suit}`

  const face = (
    <div className={`${styles.panel} ${isRed ? styles.red : styles.black}`}>
      <span className={`${styles.corner} ${styles.cornerTop}`}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.cornerSuit}>{glyph}</span>
      </span>
      <span className={styles.centerGlyph}>{glyph}</span>
      <span className={`${styles.corner} ${styles.cornerBottom}`}>
        <span className={styles.rank}>{card.rank}</span>
        <span className={styles.cornerSuit}>{glyph}</span>
      </span>
    </div>
  )

  if (!onClick) {
    return (
      <div className={classes} style={style} role="img" aria-label={label}>
        {face}
      </div>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      style={style}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      // Only meaningful where the card is a toggle (staging a discard); left
      // unset during pegging, where a tap plays the card outright.
      aria-pressed={selected}
    >
      {face}
    </button>
  )
}
