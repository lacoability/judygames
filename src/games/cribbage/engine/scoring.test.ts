import { describe, expect, it } from 'vitest'
import { cardValue, rankOrder, scoreHand, scorePeggingPlay } from './scoring'
import type { Card, Rank, Suit } from './types'

let seq = 0
function card(rank: Rank, suit: Suit): Card {
  seq += 1
  return { id: `c${seq}`, rank, suit }
}

describe('cardValue', () => {
  it('values ace as 1 and face cards as 10', () => {
    expect(cardValue('A')).toBe(1)
    expect(cardValue('10')).toBe(10)
    expect(cardValue('J')).toBe(10)
    expect(cardValue('Q')).toBe(10)
    expect(cardValue('K')).toBe(10)
    expect(cardValue('7')).toBe(7)
  })
})

describe('rankOrder', () => {
  it('orders ace low through king', () => {
    expect(rankOrder('A')).toBe(1)
    expect(rankOrder('2')).toBe(2)
    expect(rankOrder('K')).toBe(13)
  })
})

describe('scoreHand', () => {
  it('scores the maximum 29-point hand: three 5s + J of the starter suit, starter is the fourth 5', () => {
    const hand = [card('5', 'spades'), card('5', 'clubs'), card('5', 'diamonds'), card('J', 'hearts')]
    const starter = card('5', 'hearts')
    const result = scoreHand(hand, starter)
    expect(result.total).toBe(29)
  })

  it('scores a 4-card flush as 4, and 5 when the starter matches too', () => {
    const hand = [card('2', 'spades'), card('4', 'spades'), card('6', 'spades'), card('8', 'spades')]

    const mismatched = scoreHand(hand, card('Q', 'hearts'))
    expect(mismatched.total).toBe(4)
    expect(mismatched.breakdown).toEqual([{ label: 'Flush', points: 4 }])

    const matched = scoreHand(hand, card('Q', 'spades'))
    expect(matched.total).toBe(5)
    expect(matched.breakdown).toEqual([{ label: 'Flush', points: 5 }])
  })

  it('gives the crib no flush at all for a 4-card match without the starter (but 5 when starter also matches)', () => {
    const hand = [card('2', 'spades'), card('4', 'spades'), card('6', 'spades'), card('8', 'spades')]

    expect(scoreHand(hand, card('Q', 'hearts'), true).total).toBe(0)
    expect(scoreHand(hand, card('Q', 'spades'), true).total).toBe(5)
  })

  it('scores a run of 3 alongside an unrelated fifteen', () => {
    const hand = [card('3', 'spades'), card('4', 'hearts'), card('5', 'diamonds'), card('K', 'clubs')]
    const result = scoreHand(hand, card('9', 'spades'))
    expect(result.total).toBe(5)
    expect(result.breakdown).toEqual([
      { label: 'Fifteen', points: 2 },
      { label: 'Run of 3', points: 3 },
    ])
  })

  it('scores three of a kind as a pair royal worth 6, via three separate pair lines', () => {
    const hand = [card('7', 'spades'), card('7', 'hearts'), card('7', 'diamonds'), card('2', 'clubs')]
    const result = scoreHand(hand, card('K', 'spades'))
    expect(result.total).toBe(6)
    expect(result.breakdown).toEqual([
      { label: 'Pair', points: 2 },
      { label: 'Pair', points: 2 },
      { label: 'Pair', points: 2 },
    ])
  })

  it('scores nobs when the hand holds the jack matching the starter suit', () => {
    const hand = [card('J', 'spades'), card('2', 'diamonds'), card('3', 'clubs'), card('4', 'hearts')]
    const result = scoreHand(hand, card('9', 'spades'))
    expect(result.breakdown).toContainEqual({ label: 'His Nobs', points: 1 })
  })

  it('scores a double run (a pair plus two overlapping runs, plus the fifteens they create)', () => {
    // 4-5-5-6 + 9: runs 4-5-6 twice (multiplicity 2 on the 5) = 6, the pair of 5s = 2,
    // and three fifteens (6+9, and each 4-5-6 triple) = 6. Total 14.
    const hand = [card('4', 'spades'), card('5', 'hearts'), card('5', 'diamonds'), card('6', 'clubs')]
    const result = scoreHand(hand, card('9', 'spades'))
    expect(result.total).toBe(14)
    expect(result.breakdown.filter((l) => l.label === 'Fifteen')).toHaveLength(3)
    expect(result.breakdown).toContainEqual({ label: 'Pair', points: 2 })
    expect(result.breakdown).toContainEqual({ label: 'Run of 3', points: 6 })
  })
})

describe('scorePeggingPlay', () => {
  it('scores fifteen for 2', () => {
    const sequence = [card('7', 'spades'), card('8', 'hearts')]
    const result = scorePeggingPlay(sequence, 15)
    expect(result.points).toBe(2)
    expect(result.reasons).toEqual(['Fifteen for 2'])
  })

  it('does not score a 31 bonus itself — that is the caller\'s responsibility', () => {
    const sequence = [card('K', 'spades'), card('9', 'hearts'), card('2', 'diamonds')]
    const result = scorePeggingPlay(sequence, 31)
    expect(result.reasons).not.toContain('Thirty-one for 2')
  })

  it('scores a trailing pair for 2', () => {
    const sequence = [card('4', 'spades'), card('4', 'hearts')]
    const result = scorePeggingPlay(sequence, 8)
    expect(result.points).toBe(2)
    expect(result.reasons).toEqual(['Pair for 2'])
  })

  it('scores a trailing pair royal for 6', () => {
    const sequence = [card('4', 'spades'), card('4', 'hearts'), card('4', 'diamonds')]
    const result = scorePeggingPlay(sequence, 12)
    expect(result.points).toBe(6)
    expect(result.reasons).toEqual(['Pair royal for 6'])
  })

  it('scores a trailing run of 3 played out of order', () => {
    const sequence = [card('5', 'spades'), card('3', 'hearts'), card('4', 'diamonds')]
    const result = scorePeggingPlay(sequence, 12)
    expect(result.points).toBe(3)
    expect(result.reasons).toEqual(['Run of 3 for 3'])
  })

  it('does not treat a repeated rank in the window as a run', () => {
    const sequence = [card('3', 'spades'), card('3', 'hearts'), card('4', 'diamonds')]
    const result = scorePeggingPlay(sequence, 10)
    // Trailing pair (3,4 doesn't pair) — last two cards are 3,4, not equal, so no pair either.
    expect(result.reasons).toEqual([])
    expect(result.points).toBe(0)
  })

  it('scores nothing when the play does not complete 15, 31, a pair, or a run', () => {
    const sequence = [card('2', 'spades'), card('9', 'hearts')]
    const result = scorePeggingPlay(sequence, 11)
    expect(result.points).toBe(0)
    expect(result.reasons).toEqual([])
  })
})
