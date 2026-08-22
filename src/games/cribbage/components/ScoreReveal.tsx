import { useState } from 'react'
import type { ShowStage } from '../engine/types'
import { PlayingCardView } from './PlayingCardView'
import { Button } from '../../../shared/components/Button'
import styles from './ScoreReveal.module.css'

interface ScoreRevealProps {
  stages: ShowStage[]
  /** Already-possessive names, e.g. "Your" or "Nibs's" — English's "you" possessive is irregular. */
  possessiveNames: Record<string, string>
  onFinished: () => void
}

const STAGE_TITLE: Record<ShowStage['name'], string> = {
  nonDealer: 'hand',
  dealer: 'hand',
  crib: 'crib',
}

export function ScoreReveal({ stages, possessiveNames, onFinished }: ScoreRevealProps) {
  const [index, setIndex] = useState(0)
  const stage = stages[index]
  if (!stage) return null

  const isLast = index === stages.length - 1
  const title = `${possessiveNames[stage.playerId] ?? stage.playerId} ${STAGE_TITLE[stage.name]}`

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>{title}</div>
      <div className={styles.cards}>
        {stage.cards.map((c) => (
          <PlayingCardView key={c.id} card={c} size="md" />
        ))}
        <PlayingCardView card={stage.starter} size="md" className={styles.starter} />
      </div>

      {stage.result.breakdown.length === 0 ? (
        <div className={styles.noScore}>Nothing there — 0 points.</div>
      ) : (
        <ul className={styles.breakdown}>
          {stage.result.breakdown.map((line, i) => (
            <li key={i} className={styles.line} style={{ animationDelay: `${i * 90}ms` }}>
              <span>{line.label}</span>
              <span>+{line.points}</span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.total}>{stage.result.total} points</div>

      <Button onClick={() => (isLast ? onFinished() : setIndex((i) => i + 1))}>{isLast ? 'Continue' : 'Next'}</Button>
    </div>
  )
}
