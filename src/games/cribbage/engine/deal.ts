import { buildDeck, shuffle } from './deck'
import { otherPlayerId } from './pegging'
import type { GameState, RNG } from './types'

export interface PlayerSetup {
  id: string
  name: string
  isBot: boolean
}

function dealFreshHands(rng: RNG) {
  const shuffled = shuffle(buildDeck(), rng)
  return {
    handA: shuffled.slice(0, 6),
    handB: shuffled.slice(6, 12),
    deck: shuffled.slice(12),
  }
}

/**
 * Deals a fresh game: 6 cards each, dealer picked at random (a coin-flip
 * cut, simplified — real cribbage deals to whoever cuts the lower card).
 */
export function initGame(players: [PlayerSetup, PlayerSetup], rng: RNG = Math.random): GameState {
  const [a, b] = players
  const { handA, handB, deck } = dealFreshHands(rng)

  return {
    players: [
      { id: a.id, name: a.name, isBot: a.isBot, hand: handA, peggingHand: [] },
      { id: b.id, name: b.name, isBot: b.isBot, hand: handB, peggingHand: [] },
    ],
    dealerId: rng() < 0.5 ? a.id : b.id,
    phase: 'discard',
    deck,
    crib: [],
    pendingDiscards: {},
    starter: null,
    pegging: null,
    showStages: [],
    scores: { [a.id]: 0, [b.id]: 0 },
    status: 'in-progress',
    winnerId: null,
    log: [],
    handNumber: 1,
  }
}

/** Re-deals for the next hand: keeps scores, rotates the dealer. */
export function dealNextHand(state: GameState, rng: RNG = Math.random): GameState {
  const { handA, handB, deck } = dealFreshHands(rng)
  const [a, b] = state.players

  return {
    ...state,
    players: [
      { ...a, hand: handA, peggingHand: [] },
      { ...b, hand: handB, peggingHand: [] },
    ],
    dealerId: otherPlayerId(state, state.dealerId),
    phase: 'discard',
    deck,
    crib: [],
    pendingDiscards: {},
    starter: null,
    pegging: null,
    showStages: [],
    log: [],
    handNumber: state.handNumber + 1,
  }
}
