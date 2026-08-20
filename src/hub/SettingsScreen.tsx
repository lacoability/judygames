import { Link } from 'react-router-dom'
import styles from './HomeScreen.module.css'

export function SettingsScreen() {
  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <Link to="/" className={styles.settingsLink}>
          Back
        </Link>
      </header>
      <p style={{ color: 'var(--color-text-muted)' }}>Card Hub v0.0.0</p>
    </div>
  )
}
