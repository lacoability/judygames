import { Link } from 'react-router-dom'
import { GAME_REGISTRY } from './GameRegistry'
import { InstallPrompt } from './InstallPrompt'
import styles from './HomeScreen.module.css'

export function HomeScreen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Game Hub</h1>
          <p className={styles.subtitle}>Pick a table</p>
        </div>
        <Link to="/settings" className={styles.settingsLink} aria-label="Settings">
          ⚙
        </Link>
      </header>

      <div className={styles.list}>
        {GAME_REGISTRY.map((game) => (
          <Link key={game.id} to={game.route} className={styles.card}>
            <div className={styles.thumb} style={{ ['--accent' as string]: game.accentColor }}>
              <game.ThumbnailIcon />
            </div>
            <div className={styles.meta}>
              <div className={styles.cardName}>{game.name}</div>
              <div className={styles.cardDescription}>{game.description}</div>
            </div>
            <span className={styles.chevron} aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
      </div>

      <div className={styles.spacer} />
      <InstallPrompt />
    </div>
  )
}
