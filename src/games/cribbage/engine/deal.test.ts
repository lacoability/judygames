import { describe, expect, it } from 'vitest'
import { initGame, dealNextHand } from './deal'
import { createSeededRng } from '../../../shared/utils/random'

const PLAYERS: [{ id: string; name: string; isBot: boolean }, { id: string; name: string; isBot: boolean }] = [
  { id: 'human', name: 'You', isBot: false },
  { id: 'bot', name: 'Bot', isBot: true },
]

describe('initGame', () => {
  it('deals 6 cards to each player and leaves 40 in the stock', () => {
    const state = initGame(PLAYERS, createSeededRng(1))
    expect(state.players[0].hand).toHaveLength(6)
    expect(state.players[1].hand).toHaveLength(6)
    expect(state.deck).toHaveLength(40)
  })

  it('deals every card exactly once', () => {
    const state = initGame(PLAYERS, createSeededRng(1))
    const all = [...state.players[0].hand, ...state.players[1].hand, ...state.deck]
    expect(all).toHaveLength(52)
    expect(new Set(all.map((c) => c.id)).size).toBe(52)
  })

  it('starts in the discard phase with scores at zero and a dealer assigned', () => {
    const state = initGame(PLAYERS, createSeededRng(1))
    expect(state.phase).toBe('discard')
    expect(state.scores).toEqual({ human: 0, bot: 0 })
    expect(['human', 'bot']).toContain(state.dealerId)
  })
})

describe('dealNextHand', () => {
  it('rotates the dealer and preserves scores', () => {
    const state = initGame(PLAYERS, createSeededRng(1))
    state.scores.human = 40
    state.scores.bot = 25
    const next = dealNextHand(state, createSeededRng(2))
    expect(next.dealerId).not.toBe(state.dealerId)
    expect(next.scores).toEqual({ human: 40, bot: 25 })
    expect(next.phase).toBe('discard')
    expect(next.handNumber).toBe(state.handNumber + 1)
  })

  it('deals a fresh 6/6/40 split', () => {
    const state = initGame(PLAYERS, createSeededRng(3))
    const next = dealNextHand(state, createSeededRng(4))
    expect(next.players[0].hand).toHaveLength(6)
    expect(next.players[1].hand).toHaveLength(6)
    expect(next.deck).toHaveLength(40)
  })
})
