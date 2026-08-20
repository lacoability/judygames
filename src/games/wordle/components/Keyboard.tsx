import type { LetterStatus } from '../engine/evaluate'
import styles from './Keyboard.module.css'

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'back'],
]

interface KeyboardProps {
  statuses: Record<string, LetterStatus>
  disabled?: boolean
  onLetter: (letter: string) => void
  onEnter: () => void
  onBackspace: () => void
}

export function Keyboard({ statuses, disabled, onLetter, onEnter, onBackspace }: KeyboardProps) {
  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, i) => (
        <div key={i} className={styles.row}>
          {row.map((key) => {
            if (key === 'enter') {
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.key} ${styles.wide}`}
                  disabled={disabled}
                  onClick={onEnter}
                >
                  Enter
                </button>
              )
            }
            if (key === 'back') {
              return (
                <button
                  key={key}
                  type="button"
                  className={`${styles.key} ${styles.wide}`}
                  disabled={disabled}
                  onClick={onBackspace}
                  aria-label="Backspace"
                >
                  ⌫
                </button>
              )
            }
            const status = statuses[key]
            return (
              <button
                key={key}
                type="button"
                className={`${styles.key} ${status ? styles[status] : ''}`}
                disabled={disabled}
                onClick={() => onLetter(key)}
              >
                {key}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
