import { useState } from 'react'
import { useInstallPrompt } from '../shared/hooks/useInstallPrompt'
import { Button } from '../shared/components/Button'
import styles from './InstallPrompt.module.css'

const DISMISSED_KEY = 'game-hub:install-prompt-dismissed'

export function InstallPrompt() {
  const { installed, canPromptInstall, promptInstall, isIOS } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISSED_KEY) === '1')

  if (installed || dismissed || (!canPromptInstall && !isIOS)) return null

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className={styles.banner}>
      <span className={styles.text}>
        {isIOS
          ? 'Tap the Share icon, then "Add to Home Screen" to install.'
          : 'Install Game Hub for quick, offline access.'}
      </span>
      <div className={styles.actions}>
        {canPromptInstall && (
          <Button variant="primary" onClick={promptInstall}>
            Install
          </Button>
        )}
        <button className={styles.dismiss} onClick={dismiss} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  )
}
