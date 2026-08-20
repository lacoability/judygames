import type { CSSProperties } from 'react'
import type { Card, Color } from '../engine/types'
import styles from './CardView.module.css'

const COLOR_VAR: Record<Color, string> = {
  red: 'var(--uno-red)',
  yellow: 'var(--uno-yellow)',
  green: 'var(--uno-green)',
  blue: 'var(--uno-blue)',
}

/** Glyph plus how much to scale it — symbols and "+2" need to sit smaller than a bare digit. */
function glyphFor(value: Card['value']): { text: string; scale: number } {
  switch (value) {
    case 'skip':
      return { text: '⃠', scale: 1.05 }
    case 'reverse':
      return { text: '⇄', scale: 0.9 }
    case 'draw2':
      return { text: '+2', scale: 0.62 }
    case 'wild-draw4':
      return { text: '+4', scale: 0.62 }
    case 'wild':
      return { text: '', scale: 1 }
    default:
      return { text: value, scale: 1 }
  }
}

interface CardViewProps {
  card: Card
  size?: 'sm' | 'md' | 'lg' | 'xl'
  faceDown?: boolean
  disabled?: boolean
  selected?: boolean
  onClick?: () => void
  className?: string
  style?: CSSProperties
}

export function CardView({
  card,
  size = 'md',
  faceDown,
  disabled,
  selected,
  onClick,
  className,
  style,
}: CardViewProps) {
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
          <div className={styles.backOval} />
        </div>
      </div>
    )
  }

  const isWild = card.value === 'wild' || card.value === 'wild-draw4'
  const glyph = glyphFor(card.value)
  // 6 and 9 are indistinguishable once the bottom corner is rotated 180°,
  // so they get the same underline real decks use.
  const ambiguous = card.value === '6' || card.value === '9'
  const panelStyle: CSSProperties = isWild
    ? {}
    : { background: COLOR_VAR[card.color as Color], '--ink': COLOR_VAR[card.color as Color] } as CSSProperties

  const face = (
    <div className={`${styles.panel} ${isWild ? styles.wildPanel : ''}`} style={panelStyle}>
      <span className={`${styles.corner} ${styles.cornerTop} ${ambiguous ? styles.underlined : ''}`}>
        {glyph.text || '★'}
      </span>
      <span className={`${styles.corner} ${styles.cornerBottom} ${ambiguous ? styles.underlined : ''}`}>
        {glyph.text || '★'}
      </span>
      <span className={styles.oval} />
      {card.value === 'wild' ? (
        <span className={styles.wildWheel} />
      ) : (
        <span
          className={`${styles.centerGlyph} ${isWild ? styles.centerGlyphDark : ''} ${ambiguous ? styles.underlined : ''}`}
          style={{ fontSize: `calc(var(--glyph) * ${glyph.scale})` }}
        >
          {glyph.text}
        </span>
      )}
    </div>
  )

  const label = `${card.color ?? 'wild'} ${card.value}`

  if (!onClick) {
    return (
      <div className={classes} style={style} role="img" aria-label={label}>
        {face}
      </div>
    )
  }

  return (
    <button type="button" className={classes} style={style} onClick={onClick} disabled={disabled} aria-label={label}>
      {face}
    </button>
  )
}
