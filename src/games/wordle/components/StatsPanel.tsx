import type { WordleStats } from '../storage'
import styles from './StatsPanel.module.css'

interface StatsPanelProps {
  stats: WordleStats
  /** Highlights the bar for the guess count just used to solve the current puzzle. */
  highlightGuessCount?: number
}

export function StatsPanel({ stats, highlightGuessCount }: StatsPanelProps) {
  const maxCount = Math.max(1, ...stats.distribution)

  return (
    <div className={styles.panel}>
      <div className={styles.summaryRow}>
        <div className={styles.summaryStat}>
          <div className={styles.summaryValue}>{stats.played}</div>
          <div className={styles.summaryLabel}>Played</div>
        </div>
        <div className={styles.summaryStat}>
          <div className={styles.summaryValue}>{stats.winPercent}%</div>
          <div className={styles.summaryLabel}>Win rate</div>
        </div>
        <div className={styles.summaryStat}>
          <div className={styles.summaryValue}>{stats.won}</div>
          <div className={styles.summaryLabel}>Solved</div>
        </div>
      </div>

      <div className={styles.distribution}>
        {stats.distribution.map((count, i) => (
          <div key={i} className={styles.distRow}>
            <span className={styles.distLabel}>{i + 1}</span>
            <div className={styles.distTrack}>
              <div
                className={`${styles.distBar} ${highlightGuessCount === i + 1 ? styles.distBarHighlight : ''}`}
                style={{ width: `${Math.max((count / maxCount) * 100, count > 0 ? 8 : 0)}%` }}
              >
                <span className={styles.distCount}>{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
