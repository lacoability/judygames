import { useEffect, useRef, useState } from 'react'
import { evaluateGuess } from '../engine/evaluate'
import { MAX_GUESSES, WORD_LENGTH, type PuzzleStatus } from '../engine/reducer'
import { Tile } from './Tile'
import styles from './Board.module.css'

interface BoardProps {
  guesses: string[]
  currentGuess: string
  answer: string
  status: PuzzleStatus
  invalidPulse: number
  /** The one row (usually the guess just submitted) allowed to play its flip-reveal. */
  animateRowIndex: number | null
}

export function Board({ guesses, currentGuess, answer, status, invalidPulse, animateRowIndex }: BoardProps) {
  const [shaking, setShaking] = useState(false)
  const prevPulseRef = useRef(invalidPulse)

  useEffect(() => {
    if (invalidPulse === prevPulseRef.current) return
    prevPulseRef.current = invalidPulse
    setShaking(true)
    const timer = setTimeout(() => setShaking(false), 420)
    return () => clearTimeout(timer)
  }, [invalidPulse])

  const activeRowIndex = status === 'in-progress' ? guesses.length : -1

  const rows = Array.from({ length: MAX_GUESSES }, (_, row) => {
    if (row < guesses.length) {
      const guess = guesses[row]
      const letterStatuses = evaluateGuess(guess, answer)
      const animate = row === animateRowIndex
      return (
        <div key={row} className={styles.row}>
          {guess.split('').map((letter, col) => (
            <Tile key={col} letter={letter} status={letterStatuses[col]} revealDelayMs={animate ? col * 220 : 0} />
          ))}
        </div>
      )
    }

    if (row === activeRowIndex) {
      const letters = currentGuess.padEnd(WORD_LENGTH, ' ').split('')
      return (
        <div key={row} className={`${styles.row} ${shaking ? styles.shake : ''}`}>
          {letters.map((letter, col) => (
            <Tile key={col} letter={letter.trim()} />
          ))}
        </div>
      )
    }

    return (
      <div key={row} className={styles.row}>
        {Array.from({ length: WORD_LENGTH }, (_, col) => (
          <Tile key={col} letter="" />
        ))}
      </div>
    )
  })

  return <div className={styles.board}>{rows}</div>
}
