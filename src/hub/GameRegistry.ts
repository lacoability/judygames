import type { GameModule } from '../shared/types/GameModule'
import { unoGameModule } from '../games/uno'

export const GAME_REGISTRY: GameModule[] = [unoGameModule]
