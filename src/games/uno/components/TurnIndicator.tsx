import styles from './TurnIndicator.module.css'

interface TurnIndicatorProps {
  label: string
  direction: 1 | -1
  highlight?: boolean
}

export function TurnIndicator({ label, direction, highlight }: TurnIndicatorProps) {
  return (
    <span className={`${styles.pill} ${highlight ? styles.yours : ''}`}>
      <span className={`${styles.arrow} ${direction === -1 ? styles.reversed : ''}`} aria-hidden="true">
        ↻
      </span>
      {label}
    </span>
  )
}
