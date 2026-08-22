import { describe, expect, it } from 'vitest'
import { chooseDiscard, choosePeggingPlay } from './botAI'
import type { Card, Rank, Suit } from '../engine/types'

let seq = 0
function card(rank: Rank, suit: Suit): Card {
  seq += 1
  return { id: `b${seq}`, rank, suit }
}

describe('chooseDiscard', () => {
  it('returns two distinct cards from the given hand', () => {
    const hand = [
      card('2', 'spades'),
      card('4', 'hearts'),
      card('6', 'diamonds'),
      card('8', 'clubs'),
      card('10', 'spades'),
      card('K', 'hearts'),
    ]
    const [a, b] = chooseDiscard(hand, false)
    expect(hand).toContain(a)
    expect(hand).toContain(b)
    expect(a).not.toBe(b)
  })

  it('breaks up an unrelated 2 and K rather than the four 5s that dominate the hand value', () => {
    const hand = [card('5', 'spades'), card('5', 'hearts'), card('5', 'diamonds'), card('5', 'clubs'), card('2', 'spades'), card('K', 'hearts')]
    const discard = chooseDiscard(hand, false)
    const ranks = discard.map((c) => c.rank).sort()
    expect(ranks).toEqual(['2', 'K'])
  })
})

describe('choosePeggingPlay', () => {
  it('says go when nothing is playable', () => {
    expect(choosePeggingPlay([], 20, [])).toEqual({ type: 'go' })
  })

  it('prefers a card that completes fifteen over one that does not', () => {
    const eight = card('8', 'hearts') // 7 + 8 = 15
    const two = card('2', 'clubs') // 7 + 2 = 9, no score
    const decision = choosePeggingPlay([eight, two], 7, [card('7', 'spades')])
    expect(decision).toEqual({ type: 'play', card: eight })
  })

  it('takes an exact 31 over a card that scores nothing', () => {
    const five = card('5', 'clubs') // 26 + 5 = 31
    const two = card('2', 'hearts') // 26 + 2 = 28, no score
    const decision = choosePeggingPlay([two, five], 26, [card('K', 'spades')])
    expect(decision).toEqual({ type: 'play', card: five })
  })

  it('avoids leaving the count at 21 when an equally-unscoring alternative exists', () => {
    const four = card('4', 'diamonds') // count -> 21, dangerous
    const three = card('3', 'clubs') // count -> 20, safe, no score either way
    const decision = choosePeggingPlay([four, three], 17, [])
    expect(decision).toEqual({ type: 'play', card: three })
  })

  it('sheds the lowest card when nothing else distinguishes the options', () => {
    const nine = card('9', 'spades')
    const three = card('3', 'hearts')
    const decision = choosePeggingPlay([nine, three], 0, [])
    expect(decision).toEqual({ type: 'play', card: three })
  })
})
