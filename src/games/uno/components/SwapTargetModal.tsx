import { Modal } from '../../../shared/components/Modal'
import type { Player } from '../engine/types'
import { Button } from '../../../shared/components/Button'
import modalStyles from '../../../shared/components/Modal.module.css'

interface SwapTargetModalProps {
  open: boolean
  opponents: Player[]
  onChoose: (playerId: string) => void
}

export function SwapTargetModal({ open, opponents, onChoose }: SwapTargetModalProps) {
  return (
    <Modal open={open} variant="sheet">
      <h2 className={modalStyles.title}>Swap hands with…</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {opponents.map((p) => (
          <Button key={p.id} variant="secondary" onClick={() => onChoose(p.id)}>
            {p.name} · {p.hand.length} card{p.hand.length === 1 ? '' : 's'}
          </Button>
        ))}
      </div>
    </Modal>
  )
}
