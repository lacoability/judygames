import { Link } from 'react-router-dom'
import type { StackingMode, VariantConfig } from '../engine/types'
import { Button } from '../../../shared/components/Button'
import { winPercentage, type GameStats } from '../../../shared/utils/stats'
import styles from './VariantSettingsPanel.module.css'

const STACKING_OPTIONS: { value: StackingMode; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'draw2-only', label: '+2 on +2' },
  { value: 'draw2-and-draw4-cross-stack', label: '+2 / +4' },
]

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: () => void }) {
  return (
    <div className={styles.toggleRow}>
      <div className={styles.toggleLabel}>
        <span>{label}</span>
        <span className={styles.toggleHint}>{hint}</span>
      </div>
      <button
        type="button"
        className={`${styles.switch} ${on ? styles.switchOn : ''}`}
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onChange}
      >
        <span className={`${styles.knob} ${on ? styles.knobOn : ''}`} />
      </button>
    </div>
  )
}

interface VariantSettingsPanelProps {
  variants: VariantConfig
  onVariantsChange: (variants: VariantConfig) => void
  botCount: number
  onBotCountChange: (count: number) => void
  onStart: () => void
  stats: GameStats
}

export function VariantSettingsPanel({
  variants,
  onVariantsChange,
  botCount,
  onBotCountChange,
  onStart,
  stats,
}: VariantSettingsPanelProps) {
  const hasPlayed = stats.wins + stats.losses > 0

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Wild Cards</h1>
        <Link to="/" className={styles.backLink}>
          Back
        </Link>
      </header>

      {hasPlayed && (
        <div className={styles.record}>
          <div className={styles.recordStat}>
            <div className={styles.recordValue}>{stats.wins}</div>
            <div className={styles.recordLabel}>Wins</div>
          </div>
          <div className={styles.recordStat}>
            <div className={styles.recordValue}>{winPercentage(stats)}%</div>
            <div className={styles.recordLabel}>Win rate</div>
          </div>
          <div className={styles.recordStat}>
            <div className={styles.recordValue}>{stats.currentStreak}</div>
            <div className={styles.recordLabel}>Streak</div>
          </div>
          <div className={styles.recordStat}>
            <div className={styles.recordValue}>{stats.bestStreak}</div>
            <div className={styles.recordLabel}>Best</div>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Players</span>
        <div className={styles.stepper}>
          <button
            type="button"
            className={styles.stepperButton}
            disabled={botCount <= 1}
            onClick={() => onBotCountChange(Math.max(1, botCount - 1))}
            aria-label="Fewer bots"
          >
            −
          </button>
          <span className={styles.stepperValue}>You + {botCount} bot{botCount === 1 ? '' : 's'}</span>
          <button
            type="button"
            className={styles.stepperButton}
            disabled={botCount >= 3}
            onClick={() => onBotCountChange(Math.min(3, botCount + 1))}
            aria-label="More bots"
          >
            +
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <span className={styles.sectionTitle}>Draw stacking</span>
        <p className={styles.sectionHint}>Answer a +2 or +4 with another instead of drawing.</p>
        <div className={styles.segmented}>
          {STACKING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.segment} ${variants.stacking === opt.value ? styles.segmentActive : ''}`}
              onClick={() => onVariantsChange({ ...variants, stacking: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <Toggle
          label="Jump-in"
          hint="Play an exact match out of turn."
          on={variants.jumpIn}
          onChange={() => onVariantsChange({ ...variants, jumpIn: !variants.jumpIn })}
        />
        <Toggle
          label="7-0 rule"
          hint="7 swaps hands, 0 passes everyone's hand along."
          on={variants.sevenZero}
          onChange={() => onVariantsChange({ ...variants, sevenZero: !variants.sevenZero })}
        />
      </div>

      <div className={styles.spacer} />

      <Button onClick={onStart}>Start Game</Button>
    </div>
  )
}
