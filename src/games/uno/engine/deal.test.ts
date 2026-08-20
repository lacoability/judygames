import { describe, expect, it } from 'vitest'
import { dealHands, initGame } from './deal'
import { buildDeck } from './deck'
import { createSeededRng } from '../../../shared/utils/random'
import { DEFAULT_VARIANTS } from './types'

describe('dealHands', () => {
  it('deals 7 cards to each player and removes them from the deck', () => {
    const deck = buildDeck()
    const { hands, remainingDeck } = dealHands(deck, 4)
    expect(hands).toHaveLength(4)
    for (const hand of hands) expect(hand).toHaveLength(7)
    expect(remainingDeck).toHaveLength(108 - 4 * 7)
  })
})

describe('initGame', () => {
  const players = [
    { id: 'p1', name: 'You', isBot: false },
    { id: 'p2', name: 'Bot 1', isBot: true },
    { id: 'p3', name: 'Bot 2', isBot: true },
  ]

  it('deals hands, sets a starting discard card, and never opens on a Wild Draw Four', () => {
    // Run many seeds since Wild Draw Four openings are randomly re-drawn.
    for (let seed = 0; seed < 30; seed++) {
      const state = initGame(players, DEFAULT_VARIANTS, createSeededRng(seed))
      expect(state.discardPile).toHaveLength(1)
      expect(state.discardPile[0].value).not.toBe('wild-draw4')
      expect(state.players.every((p) => p.hand.length === 7)).toBe(true)
      expect(['red', 'yellow', 'green', 'blue']).toContain(state.activeColor)
      expect(state.status).toBe('in-progress')
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.direction).toBe(1)
    }
  })

  it('deck + hands + discard account for the full 108 cards', () => {
    const state = initGame(players, DEFAULT_VARIANTS, createSeededRng(11))
    const total =
      state.drawPile.length + state.discardPile.length + state.players.reduce((sum, p) => sum + p.hand.length, 0)
    expect(total).toBe(108)
  })
})
