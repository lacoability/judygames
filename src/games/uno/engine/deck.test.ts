import { describe, expect, it } from 'vitest'
import { buildDeck, shuffle } from './deck'
import { createSeededRng } from '../../../shared/utils/random'

describe('buildDeck', () => {
  it('has 108 cards total', () => {
    expect(buildDeck()).toHaveLength(108)
  })

  it('has 25 cards per color and 8 wilds', () => {
    const deck = buildDeck()
    for (const color of ['red', 'yellow', 'green', 'blue'] as const) {
      expect(deck.filter((c) => c.color === color)).toHaveLength(25)
    }
    expect(deck.filter((c) => c.value === 'wild')).toHaveLength(4)
    expect(deck.filter((c) => c.value === 'wild-draw4')).toHaveLength(4)
  })

  it('has exactly one 0 and two of each 1-9 per color', () => {
    const deck = buildDeck()
    const red = deck.filter((c) => c.color === 'red')
    expect(red.filter((c) => c.value === '0')).toHaveLength(1)
    for (const n of ['1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(red.filter((c) => c.value === n)).toHaveLength(2)
    }
  })

  it('gives every card a unique id', () => {
    const deck = buildDeck()
    expect(new Set(deck.map((c) => c.id)).size).toBe(108)
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
