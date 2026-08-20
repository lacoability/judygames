import type { GameModule } from '../shared/types/GameModule'
import { unoGameModule } from '../games/uno'
import { wordleGameModule } from '../games/wordle'

export const GAME_REGISTRY: GameModule[] = [unoGameModule, wordleGameModule]
