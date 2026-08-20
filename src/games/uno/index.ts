import type { GameModule } from '../../shared/types/GameModule'
import { UnoGame } from './UnoGame'
import { ThumbnailIcon } from './ThumbnailIcon'

export const unoGameModule: GameModule = {
  id: 'wild-cards',
  name: 'Wild Cards',
  description: 'A classic matching card game for 2-4 players, against bots.',
  route: '/games/wild-cards',
  accentColor: 'var(--uno-red)',
  ThumbnailIcon,
  Component: UnoGame,
}
