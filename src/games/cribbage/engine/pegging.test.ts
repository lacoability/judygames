import { describe, expect, it } from 'vitest'
import { applyGo, applyPegPlay, legalPeggingCards } from './pegging'
import type { Card, GameState, Rank, Suit } from './types'

let seq = 0
function card(rank: Rank, suit: Suit): Card {
  seq += 1
  return { id: `p${seq}`, rank, suit }
}

function makeState(handA: Card[], handB: Card[], turnPlayerId: 'a' | 'b'): GameState {
  return {
    players: [
      { id: 'a', name: 'A', isBot: false, hand: [...handA], peggingHand: [...handA] },
      { id: 'b', name: 'B', isBot: true, hand: [...handB], peggingHand: [...handB] },
    ],
    dealerId: 'b',
    phase: 'pegging',
    deck: [],
    crib: [],
    pendingDiscards: {},
    starter: card('2', 'clubs'),
    pegging: { sequence: [], count: 0, stuck: [], turnPlayerId },
    showStages: [],
    scores: { a: 0, b: 0 },
    status: 'in-progress',
    winnerId: null,
    log: [],
    handNumber: 1,
  }
}

describe('legalPeggingCards', () => {
  it('excludes cards that would push the count past 31', () => {
    const hand = [card('K', 'spades'), card('5', 'hearts')]
    expect(legalPeggingCards(hand, 25).map((c) => c.rank)).toEqual(['5'])
  })
})

describe('applyPegPlay', () => {
  it('alternates the turn on an unremarkable play', () => {
    const state = makeState([card('2', 'spades'), card('9', 'hearts')], [card('3', 'clubs'), card('9', 'diamonds')], 'a')
    const next = applyPegPlay(state, 'a', state.players[0].peggingHand[0])
    expect(next.pegging!.turnPlayerId).toBe('b')
    expect(next.pegging!.count).toBe(2)
    expect(next.scores.a).toBe(0)
  })

  it('scores fifteen for 2', () => {
    const seven = card('7', 'spades')
    const eight = card('8', 'hearts')
    let state = makeState([seven, card('2', 'clubs')], [eight, card('3', 'diamonds')], 'a')
    state = applyPegPlay(state, 'a', seven)
    const next = applyPegPlay(state, 'b', eight)
    expect(next.pegging!.count).toBe(15)
    expect(next.scores.b).toBe(2)
  })

  it('scores a pair for 2 when the same rank is played right after', () => {
    const fourA = card('4', 'spades')
    const fourB = card('4', 'hearts')
    let state = makeState([fourA, card('9', 'clubs')], [fourB, card('9', 'diamonds')], 'a')
    state = applyPegPlay(state, 'a', fourA)
    const next = applyPegPlay(state, 'b', fourB)
    expect(next.scores.b).toBe(2)
  })

  it('scores 2 for hitting exactly 31 and resets the street to the opponent of whoever played it', () => {
    const king = card('K', 'spades')
    const queen = card('Q', 'hearts')
    const nine = card('9', 'clubs')
    const two = card('2', 'diamonds')
    // Extra leftover cards so both hands aren't ALSO empty right when 31 hits —
    // that's covered by the separate "last card" test below.
    let state = makeState([king, nine, card('6', 'spades')], [queen, two, card('7', 'hearts')], 'a')
    state = applyPegPlay(state, 'a', king) // count 10, turn -> b
    state = applyPegPlay(state, 'b', queen) // count 20, turn -> a
    state = applyPegPlay(state, 'a', nine) // count 29, turn -> b
    const next = applyPegPlay(state, 'b', two) // count 31!

    expect(next.scores.b).toBe(2)
    expect(next.pegging!.count).toBe(0)
    expect(next.pegging!.sequence).toEqual([])
    // The player who did NOT just make 31 leads the next street.
    expect(next.pegging!.turnPlayerId).toBe('a')
  })

  it('keeps the turn when the opponent cannot answer, instead of bouncing it back to them', () => {
    const three = card('3', 'spades')
    const four = card('4', 'spades')
    const king = card('K', 'hearts')
    const state = makeState([three, four], [king], 'a')
    state.pegging!.count = 24 // A's 3 and 4 fit; B's king (10) never will

    const next = applyPegPlay(state, 'a', three) // count 27
    expect(next.pegging!.turnPlayerId).toBe('a') // A plays on rather than passing
    expect(next.pegging!.stuck).toEqual(['b']) // B is recorded as being on a go
    expect(next.log).toContainEqual({ type: 'go', playerId: 'b' })
  })

  it('ends the street with a go point once neither player can continue', () => {
    const three = card('3', 'spades')
    const nine = card('9', 'spades')
    const king = card('K', 'hearts')
    const state = makeState([three, nine], [king], 'a')
    state.pegging!.count = 27 // after A's 3 -> 30, neither the 9 nor the king fits

    const next = applyPegPlay(state, 'a', three)
    expect(next.scores.a).toBe(1) // A laid the last card, so takes the go
    expect(next.pegging!.count).toBe(0)
    expect(next.pegging!.turnPlayerId).toBe('b') // opponent leads the next street
    expect(next.phase).toBe('pegging') // both still hold cards
  })

  it('scores 1 for last card when the final play does not hit 31, and moves to the show', () => {
    const three = card('3', 'spades')
    const state = makeState([three], [], 'a')
    const next = applyPegPlay(state, 'a', three)
    expect(next.scores.a).toBe(1)
    expect(next.phase).toBe('show')
    expect(next.pegging).toBeNull()
  })

  it('declares a win the moment a peg crosses 121, without finishing the turn logic', () => {
    const seven = card('7', 'spades')
    const eight = card('8', 'hearts')
    let state = makeState([seven, card('2', 'clubs')], [eight, card('3', 'diamonds')], 'a')
    state.scores.a = 119
    state = applyPegPlay(state, 'a', seven) // no score, count 7
    state.scores.b = 119
    const next = applyPegPlay(state, 'b', eight) // fifteen for 2 -> 121
    expect(next.status).toBe('won')
    expect(next.winnerId).toBe('b')
    expect(next.phase).toBe('gameOver')
  })
})

describe('applyGo', () => {
  it('passes the turn to the other player when they can still respond', () => {
    const five = card('5', 'spades')
    const ace = card('A', 'hearts')
    const state = makeState([five], [ace], 'a')
    state.pegging!.count = 28 // 28 + 5 = 33, so A has no legal play
    const next = applyGo(state, 'a')
    expect(next.pegging!.turnPlayerId).toBe('b')
    expect(next.pegging!.stuck).toEqual(['a'])
  })

  it('resolves the street to the last player who actually played when both are stuck', () => {
    const six = card('6', 'spades')
    const seven = card('7', 'hearts')
    let state = makeState([seven], [six], 'a')
    // A plays 7 (count 7), then B is stuck at count 7 with only a 6 left... use a count where
    // both remaining cards are too big instead, so the go resolves without either playing again.
    state = applyPegPlay(state, 'a', seven) // count 7, turn -> b
    state.pegging!.count = 26 // 26 + 6 = 32 for B's remaining 6 — too big
    const next = applyGo(state, 'b')
    expect(next.scores.a).toBe(1) // last player to actually play a card was A
    expect(next.pegging!.count).toBe(0)
    expect(next.pegging!.turnPlayerId).toBe('b') // opponent of A (the scorer) leads next
  })

  it('moves to the show once a go resolves and both hands are already empty (defensive path — applyPegPlay normally catches this first)', () => {
    const four = card('4', 'spades')
    const state = makeState([], [], 'a')
    state.pegging!.sequence = [{ card: four, playerId: 'b' }]
    state.pegging!.count = 30
    const next = applyGo(state, 'a')
    expect(next.scores.b).toBe(1)
    expect(next.phase).toBe('show')
    expect(next.pegging).toBeNull()
  })
})
