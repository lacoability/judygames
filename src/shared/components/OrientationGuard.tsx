import { useEffect } from 'react'
import type { ReactNode } from 'react'
import styles from './OrientationGuard.module.css'

/**
 * The app is designed portrait-only (the manifest also declares
 * orientation: 'portrait', which Android honors for an installed PWA). Two
 * gaps that leaves: iOS Safari/PWAs have no orientation-lock mechanism at
 * all, and a browser tab (not installed) ignores the manifest too. This
 * covers both with a CSS-only overlay that only ever shows on a touch
 * device actually held in landscape — real landscape monitors are
 * `hover: hover`/`pointer: fine` and never match.
 */
export function OrientationGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Best-effort native lock for browsers that support it in this display
    // mode (mainly Android Chrome once installed) — silently ignored where
    // it's unsupported or requires fullscreen first.
    const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }
    orientation.lock?.('portrait').catch(() => {})
  }, [])

  return (
    <>
      {children}
      <div className={styles.overlay} role="alert">
        <div className={styles.icon} aria-hidden="true">
          ⟳
        </div>
        <p className={styles.text}>Rotate back to portrait to keep playing</p>
      </div>
    </>
  )
}
