import { describe, expect, it } from 'vitest'
import { initGame } from './deal'
import { gameReducer } from './gameReducer'
import { legalPeggingCards } from './pegging'
import { WINNING_SCORE } from './scoring'
import { chooseDiscard, choosePeggingPlay } from '../bot/botAI'
import { createSeededRng } from '../../../shared/utils/random'
import type { GameState } from './types'

const PLAYERS: [
  { id: string; name: string; isBot: boolean },
  { id: string; name: string; isBot: boolean },
] = [
  { id: 'a', name: 'A', isBot: true },
  { id: 'b', name: 'B', isBot: true },
]

interface GameReport {
  final: GameState
  hands: number
  /** Every distinct count reached during pegging, to assert none broke 31. */
  maxCount: number
}

/**
 * Drives a whole game with the bot on both seats. Any stall — a reducer
 * returning the state unchanged — throws immediately rather than spinning,
 * so a deadlock in the go/31 handling surfaces as a test failure.
 */
function playGame(seed: number): GameReport {
  let state = initGame(PLAYERS, createSeededRng(seed))
  let steps = 0
  let hands = 1
  let maxCount = 0

  while (state.status !== 'won') {
    steps += 1
    if (steps > 5000) throw new Error(`game did not terminate (seed ${seed})`)
    const before = state

    if (state.phase === 'discard') {
      const pending = state.players.find((p) => !state.pendingDiscards[p.id])!
      const [d1, d2] = chooseDiscard(pending.hand, state.dealerId === pending.id)
      state = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: pending.id, cardIds: [d1.id, d2.id] })
    } else if (state.phase === 'pegging') {
      const pegging = state.pegging!
      maxCount = Math.max(maxCount, pegging.count)
      const turnId = pegging.turnPlayerId
      const player = state.players.find((p) => p.id === turnId)!
      const legal = legalPeggingCards(player.peggingHand, pegging.count)
      const decision = choosePeggingPlay(
        legal,
        pegging.count,
        pegging.sequence.map((e) => e.card),
      )
      state =
        decision.type === 'go'
          ? gameReducer(state, { type: 'SAY_GO', playerId: turnId })
          : gameReducer(state, { type: 'PLAY_PEG_CARD', playerId: turnId, card: decision.card })
    } else if (state.phase === 'show') {
      // Every card must have been laid before the show opens.
      expect(state.players[0].peggingHand).toHaveLength(0)
      expect(state.players[1].peggingHand).toHaveLength(0)
      expect(state.showStages).toHaveLength(3)
      hands += 1
      state = gameReducer(state, { type: 'START_NEXT_HAND', rng: createSeededRng(seed * 31 + hands) })
    } else {
      break
    }

    if (state === before) {
      throw new Error(`stalled in phase ${before.phase} (seed ${seed}, step ${steps})`)
    }
  }

  return { final: state, hands, maxCount }
}

describe('full-game simulation', () => {
  const seeds = Array.from({ length: 40 }, (_, i) => i + 1)

  it('always reaches a winner without stalling', () => {
    for (const seed of seeds) {
      const { final } = playGame(seed)
      expect(final.status).toBe('won')
      expect(final.winnerId).not.toBeNull()
    }
  })

  it('never lets the pegging count pass 31', () => {
    for (const seed of seeds) {
      expect(playGame(seed).maxCount).toBeLessThanOrEqual(31)
    }
  })

  it('stops the moment someone crosses 121, leaving the loser short', () => {
    for (const seed of seeds) {
      const { final } = playGame(seed)
      const winner = final.scores[final.winnerId!]
      const loser = final.scores[final.winnerId === 'a' ? 'b' : 'a']
      expect(winner).toBeGreaterThanOrEqual(WINNING_SCORE)
      expect(loser).toBeLessThan(WINNING_SCORE)
    }
  })

  it('alternates the deal every hand', () => {
    // 121 points at a realistic clip should always take more than one deal.
    for (const seed of seeds) {
      expect(playGame(seed).hands).toBeGreaterThan(1)
    }
  })

  it('deals a fresh, complete, duplicate-free hand each time', () => {
    for (const seed of seeds.slice(0, 10)) {
      const { final } = playGame(seed)
      const all = [...final.players[0].hand, ...final.players[1].hand, ...final.crib, ...final.deck]
      if (final.starter) all.push(final.starter)
      expect(new Set(all.map((c) => c.id)).size).toBe(all.length)
    }
  })
})
