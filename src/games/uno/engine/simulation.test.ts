import { describe, expect, it } from 'vitest'
import { initGame } from './deal'
import { getPlayableCards } from './rules'
import { gameReducer } from './gameReducer'
import { createSeededRng } from '../../../shared/utils/random'
import { withVariants } from './testHelpers'
import type { GameState, StackingMode } from './types'

// A naive "always play the first legal card, otherwise draw" strategy —
// good enough to exercise every code path in the reducer without needing
// the real bot AI (that lands in a later build phase).
function playOneTurn(state: GameState, rng: () => number): GameState {
  const player = state.players[state.currentPlayerIndex]
  const playable = getPlayableCards(player.hand, state)

  let next: GameState
  if (playable.length > 0) {
    const chosen = playable[0]
    const isWild = chosen.value === 'wild' || chosen.value === 'wild-draw4'
    const colors = ['red', 'yellow', 'green', 'blue'] as const
    const chosenColor = isWild ? colors[Math.floor(rng() * 4)] : undefined
    const needsSwapTarget = chosen.value === '7' && state.variants.sevenZero
    const swapTargetId = needsSwapTarget
      ? state.players.find((p) => p.id !== player.id)!.id
      : undefined
    next = gameReducer(state, {
      type: 'PLAY_CARD',
      playerId: player.id,
      card: chosen,
      chosenColor,
      swapTargetId,
    })
  } else {
    next = gameReducer(state, { type: 'DRAW_CARD', playerId: player.id })
  }

  if (next.players.find((p) => p.id === player.id)!.hand.length === 1) {
    next = gameReducer(next, { type: 'CALL_UNO', playerId: player.id })
  }
  return next
}

function simulateGame(seed: number, stacking: StackingMode, jumpIn: boolean, sevenZero: boolean) {
  const rng = createSeededRng(seed)
  const players = [
    { id: 'p1', name: 'P1', isBot: true },
    { id: 'p2', name: 'P2', isBot: true },
    { id: 'p3', name: 'P3', isBot: true },
    { id: 'p4', name: 'P4', isBot: true },
  ]
  let state = initGame(players, withVariants({ stacking, jumpIn, sevenZero }), rng)

  const MAX_TURNS = 5000
  let turns = 0
  while (state.status !== 'won' && turns < MAX_TURNS) {
    state = playOneTurn(state, rng)
    turns += 1
  }
  return { state, turns }
}

describe('full game simulation', () => {
  const configs: Array<[StackingMode, boolean, boolean]> = [
    ['off', false, false],
    ['draw2-only', false, false],
    ['draw2-and-draw4-cross-stack', false, false],
    ['off', true, false],
    ['off', false, true],
    ['draw2-and-draw4-cross-stack', true, true],
  ]

  for (const [stacking, jumpIn, sevenZero] of configs) {
    it(`terminates with a winner (stacking=${stacking}, jumpIn=${jumpIn}, sevenZero=${sevenZero})`, () => {
      for (let seed = 0; seed < 5; seed++) {
        const { state, turns } = simulateGame(seed, stacking, jumpIn, sevenZero)
        expect(state.status).toBe('won')
        expect(state.winnerId).not.toBeNull()
        expect(turns).toBeLessThan(5000)

        const winner = state.players.find((p) => p.id === state.winnerId)!
        expect(winner.hand).toHaveLength(0)

        const totalCards =
          state.drawPile.length + state.discardPile.length + state.players.reduce((sum, p) => sum + p.hand.length, 0)
        expect(totalCards).toBe(108)
      }
    })
  }
})
