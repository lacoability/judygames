import { Modal } from '../../../shared/components/Modal'
import type { Color } from '../engine/types'
import modalStyles from '../../../shared/components/Modal.module.css'
import styles from './ColorPickerModal.module.css'

const OPTIONS: { color: Color; label: string }[] = [
  { color: 'red', label: 'Red' },
  { color: 'yellow', label: 'Yellow' },
  { color: 'green', label: 'Green' },
  { color: 'blue', label: 'Blue' },
]

interface ColorPickerModalProps {
  open: boolean
  onChoose: (color: Color) => void
}

export function ColorPickerModal({ open, onChoose }: ColorPickerModalProps) {
  return (
    <Modal open={open} variant="sheet">
      <h2 className={modalStyles.title}>Choose a colour</h2>
      <div className={styles.grid}>
        {OPTIONS.map(({ color, label }) => (
          <button
            key={color}
            type="button"
            className={styles.swatch}
            style={{ background: `var(--uno-${color})` }}
            onClick={() => onChoose(color)}
          >
            {label}
          </button>
        ))}
      </div>
    </Modal>
  )
}
