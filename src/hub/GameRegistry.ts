import type { GameModule } from '../shared/types/GameModule'
import { unoGameModule } from '../games/uno'
import { wordleGameModule } from '../games/wordle'
import { cribbageGameModule } from '../games/cribbage'

export const GAME_REGISTRY: GameModule[] = [unoGameModule, wordleGameModule, cribbageGameModule]
