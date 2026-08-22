import { describe, expect, it } from 'vitest'
import { gameReducer } from './gameReducer'
import type { Card, GameState, Rank, Suit } from './types'

let seq = 0
function card(rank: Rank, suit: Suit): Card {
  seq += 1
  return { id: `g${seq}`, rank, suit }
}

function makeDiscardState(handA: Card[], handB: Card[], deck: Card[], dealerId: 'a' | 'b' = 'b'): GameState {
  return {
    players: [
      { id: 'a', name: 'A', isBot: false, hand: [...handA], peggingHand: [] },
      { id: 'b', name: 'B', isBot: true, hand: [...handB], peggingHand: [] },
    ],
    dealerId,
    phase: 'discard',
    deck: [...deck],
    crib: [],
    pendingDiscards: {},
    starter: null,
    pegging: null,
    showStages: [],
    scores: { a: 0, b: 0 },
    status: 'in-progress',
    winnerId: null,
    log: [],
    handNumber: 1,
  }
}

function sixHand(startRank: number, suit: Suit): Card[] {
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  return Array.from({ length: 6 }, (_, i) => card(ranks[(startRank + i) % 13], suit))
}

describe('gameReducer CONFIRM_DISCARD', () => {
  it('waits for the second player before moving anything', () => {
    const handA = sixHand(0, 'spades')
    const handB = sixHand(6, 'hearts')
    const deck = [card('3', 'clubs'), card('4', 'clubs')]
    const state = makeDiscardState(handA, handB, deck)

    const next = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'a', cardIds: [handA[0].id, handA[1].id] })
    expect(next.phase).toBe('discard')
    expect(next.pendingDiscards.a).toHaveLength(2)
    expect(next.players[0].hand).toHaveLength(6) // untouched until both confirm
  })

  it('moves both discards to the crib, cuts a starter, and opens pegging once both confirm', () => {
    const handA = sixHand(0, 'spades')
    const handB = sixHand(6, 'hearts')
    const deck = [card('3', 'clubs'), card('4', 'clubs')]
    let state = makeDiscardState(handA, handB, deck, 'b')

    state = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'a', cardIds: [handA[0].id, handA[1].id] })
    const next = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'b', cardIds: [handB[0].id, handB[1].id] })

    expect(next.phase).toBe('pegging')
    expect(next.players[0].hand).toHaveLength(4)
    expect(next.players[1].hand).toHaveLength(4)
    expect(next.players[0].peggingHand).toHaveLength(4)
    expect(next.crib).toHaveLength(4)
    expect(next.starter).toEqual(deck[0])
    // Dealer is 'b', so non-dealer 'a' leads the pegging.
    expect(next.pegging!.turnPlayerId).toBe('a')
  })

  it('scores his heels for the dealer when the cut starter is a jack', () => {
    const handA = sixHand(0, 'spades')
    const handB = sixHand(6, 'hearts')
    const deck = [card('J', 'clubs'), card('4', 'clubs')]
    let state = makeDiscardState(handA, handB, deck, 'b')

    state = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'a', cardIds: [handA[0].id, handA[1].id] })
    const next = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'b', cardIds: [handB[0].id, handB[1].id] })

    expect(next.scores.b).toBe(2)
    expect(next.log).toContainEqual({ type: 'hisHeels', playerId: 'b' })
  })

  it('wins immediately if his heels crosses 121', () => {
    const handA = sixHand(0, 'spades')
    const handB = sixHand(6, 'hearts')
    const deck = [card('J', 'clubs'), card('4', 'clubs')]
    let state = makeDiscardState(handA, handB, deck, 'b')
    state.scores.b = 119

    state = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'a', cardIds: [handA[0].id, handA[1].id] })
    const next = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'b', cardIds: [handB[0].id, handB[1].id] })

    expect(next.status).toBe('won')
    expect(next.winnerId).toBe('b')
    expect(next.phase).toBe('gameOver')
  })

  it('ignores a second CONFIRM_DISCARD from the same player', () => {
    const handA = sixHand(0, 'spades')
    const handB = sixHand(6, 'hearts')
    const deck = [card('3', 'clubs'), card('4', 'clubs')]
    let state = makeDiscardState(handA, handB, deck)
    state = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'a', cardIds: [handA[0].id, handA[1].id] })
    const next = gameReducer(state, { type: 'CONFIRM_DISCARD', playerId: 'a', cardIds: [handA[2].id, handA[3].id] })
    expect(next).toBe(state)
  })
})

describe('gameReducer PLAY_PEG_CARD / SAY_GO validation', () => {
  function makePeggingState(): GameState {
    const handA = [card('5', 'spades'), card('6', 'hearts')]
    const handB = [card('7', 'clubs'), card('8', 'diamonds')]
    return {
      players: [
        { id: 'a', name: 'A', isBot: false, hand: handA, peggingHand: handA },
        { id: 'b', name: 'B', isBot: true, hand: handB, peggingHand: handB },
      ],
      dealerId: 'b',
      phase: 'pegging',
      deck: [],
      crib: [],
      pendingDiscards: {},
      starter: card('2', 'clubs'),
      pegging: { sequence: [], count: 0, stuck: [], turnPlayerId: 'a' },
      showStages: [],
      scores: { a: 0, b: 0 },
      status: 'in-progress',
      winnerId: null,
      log: [],
      handNumber: 1,
    }
  }

  it('rejects a play out of turn', () => {
    const state = makePeggingState()
    const next = gameReducer(state, { type: 'PLAY_PEG_CARD', playerId: 'b', card: state.players[1].hand[0] })
    expect(next).toBe(state)
  })

  it('rejects a play that would exceed 31', () => {
    const state = makePeggingState()
    state.pegging!.count = 27
    const next = gameReducer(state, { type: 'PLAY_PEG_CARD', playerId: 'a', card: state.players[0].hand[1] }) // 6 -> 33
    expect(next).toBe(state)
  })

  it('applies a legal play', () => {
    const state = makePeggingState()
    const next = gameReducer(state, { type: 'PLAY_PEG_CARD', playerId: 'a', card: state.players[0].hand[0] })
    expect(next.pegging!.count).toBe(5)
    expect(next.pegging!.turnPlayerId).toBe('b')
  })

  it('rejects "go" when the player still has a legal card', () => {
    const state = makePeggingState()
    const next = gameReducer(state, { type: 'SAY_GO', playerId: 'a' })
    expect(next).toBe(state)
  })

  it('accepts "go" when the player truly has nothing legal to play, resolving the street once both are stuck', () => {
    const state = makePeggingState()
    const kingPlayedByB = card('K', 'hearts')
    state.pegging = { sequence: [{ card: kingPlayedByB, playerId: 'b' }], count: 27, stuck: [], turnPlayerId: 'a' }
    const next = gameReducer(state, { type: 'SAY_GO', playerId: 'a' }) // 5 and 6 both push past 31 at count 27
    // Both a and b are stuck at count 27, so the street resolves immediately:
    // b pegs 1 for "go" (the last real card played), and a — the opponent — leads next.
    expect(next.scores.b).toBe(1)
    expect(next.pegging!.count).toBe(0)
    expect(next.pegging!.turnPlayerId).toBe('a')
  })
})

describe('gameReducer START_NEXT_HAND', () => {
  it('is a no-op outside the show/gameOver phases', () => {
    const state = makeDiscardState(sixHand(0, 'spades'), sixHand(6, 'hearts'), [])
    const next = gameReducer(state, { type: 'START_NEXT_HAND' })
    expect(next).toBe(state)
  })
})
