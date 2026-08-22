import type { GameModule } from '../../shared/types/GameModule'
import { CribbageGame } from './CribbageGame'
import { ThumbnailIcon } from './ThumbnailIcon'

export const cribbageGameModule: GameModule = {
  id: 'cribbage',
  name: 'Cribbage',
  description: 'The classic pegging and counting card game. First to 121 wins.',
  route: '/games/cribbage',
  accentColor: 'var(--felt-hi)',
  ThumbnailIcon,
  Component: CribbageGame,
}
