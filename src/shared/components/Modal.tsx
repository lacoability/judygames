import type { ReactNode } from 'react'
import styles from './Modal.module.css'

interface ModalProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  /** Bottom sheet on mobile instead of a centered dialog. */
  variant?: 'center' | 'sheet'
}

export function Modal({ open, onClose, children, variant = 'center' }: ModalProps) {
  if (!open) return null
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={variant === 'sheet' ? styles.sheet : styles.dialog}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  )
}
