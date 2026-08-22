import { describe, expect, it } from 'vitest'
import { buildDeck, shuffle } from './deck'
import { createSeededRng } from '../../../shared/utils/random'

describe('buildDeck', () => {
  it('has 52 cards total', () => {
    expect(buildDeck()).toHaveLength(52)
  })

  it('has 13 cards per suit and 4 of each rank', () => {
    const deck = buildDeck()
    for (const suit of ['spades', 'hearts', 'diamonds', 'clubs'] as const) {
      expect(deck.filter((c) => c.suit === suit)).toHaveLength(13)
    }
    for (const rank of ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const) {
      expect(deck.filter((c) => c.rank === rank)).toHaveLength(4)
    }
  })

  it('gives every card a unique id', () => {
    const deck = buildDeck()
    expect(new Set(deck.map((c) => c.id)).size).toBe(52)
  })
})

describe('shuffle', () => {
  it('preserves all elements', () => {
    const deck = buildDeck()
    const shuffled = shuffle(deck, createSeededRng(42))
    expect(shuffled).toHaveLength(deck.length)
    expect(new Set(shuffled.map((c) => c.id))).toEqual(new Set(deck.map((c) => c.id)))
  })

  it('is deterministic for a given seed', () => {
    const deck = buildDeck()
    const a = shuffle(deck, createSeededRng(7))
    const b = shuffle(deck, createSeededRng(7))
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id))
  })

  it('produces different orders for different seeds', () => {
    const deck = buildDeck()
    const a = shuffle(deck, createSeededRng(1))
    const b = shuffle(deck, createSeededRng(2))
    expect(a.map((c) => c.id)).not.toEqual(b.map((c) => c.id))
  })

  it('does not mutate the input array', () => {
    const deck = buildDeck()
    const original = [...deck]
    shuffle(deck, createSeededRng(3))
    expect(deck).toEqual(original)
  })
})
