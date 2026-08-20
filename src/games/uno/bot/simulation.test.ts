import { describe, expect, it } from 'vitest'
import { initGame } from '../engine/deal'
import { gameReducer } from '../engine/gameReducer'
import { decideBotMove } from './botAI'
import { createSeededRng } from '../../../shared/utils/random'
import { withVariants } from '../engine/testHelpers'
import type { GameState, StackingMode } from '../engine/types'

// Mirrors what UnoGame.tsx's bot turn-loop will do: ask botAI for a
// decision, dispatch it, then immediately call Uno if it's down to one
// card (bots always self-report correctly — see the plan's simplification
// notes on jump-in/uno-calling).
function playBotTurn(state: GameState): GameState {
  const botId = state.players[state.currentPlayerIndex].id
  const decision = decideBotMove(state, botId)

  let next: GameState
  if (decision.type === 'draw') {
    next = gameReducer(state, { type: 'DRAW_CARD', playerId: botId })
  } else {
    next = gameReducer(state, {
      type: 'PLAY_CARD',
      playerId: botId,
      card: decision.card,
      chosenColor: decision.chosenColor,
      swapTargetId: decision.swapTargetId,
    })
  }

  if (next.players.find((p) => p.id === botId)!.hand.length === 1) {
    next = gameReducer(next, { type: 'CALL_UNO', playerId: botId })
  }
  return next
}

function simulateBotGame(seed: number, stacking: StackingMode, sevenZero: boolean) {
  const rng = createSeededRng(seed)
  const players = [
    { id: 'bot1', name: 'Bot 1', isBot: true },
    { id: 'bot2', name: 'Bot 2', isBot: true },
    { id: 'bot3', name: 'Bot 3', isBot: true },
    { id: 'bot4', name: 'Bot 4', isBot: true },
  ]
  // Jump-in is human-only, so it's intentionally left off for an all-bot game.
  let state = initGame(players, withVariants({ stacking, jumpIn: false, sevenZero }), rng)

  const MAX_TURNS = 5000
  let turns = 0
  while (state.status !== 'won' && turns < MAX_TURNS) {
    state = playBotTurn(state)
    turns += 1
  }
  return { state, turns }
}

describe('bot-vs-bot headless simulation', () => {
  const configs: Array<[StackingMode, boolean]> = [
    ['off', false],
    ['draw2-only', false],
    ['draw2-and-draw4-cross-stack', true],
  ]

  for (const [stacking, sevenZero] of configs) {
    it(`plays to completion without crashing (stacking=${stacking}, sevenZero=${sevenZero})`, () => {
      for (let seed = 0; seed < 8; seed++) {
        const { state, turns } = simulateBotGame(seed, stacking, sevenZero)
        expect(state.status).toBe('won')
        expect(turns).toBeLessThan(5000)
        expect(state.players.find((p) => p.id === state.winnerId)!.hand).toHaveLength(0)
      }
    })
  }
})
