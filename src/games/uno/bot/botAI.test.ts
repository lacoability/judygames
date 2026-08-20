import { describe, expect, it } from 'vitest'
import { decideBotMove, decideJumpIn, decideSwapTarget, decideWildColor } from './botAI'
import { card, makePlayer, makeState, withVariants } from '../engine/testHelpers'

describe('decideWildColor', () => {
  it('picks the color with the most cards in hand', () => {
    const hand = [card('red', '1'), card('red', '2'), card('blue', '3'), card(null, 'wild')]
    expect(decideWildColor(hand)).toBe('red')
  })

  it('falls back to a fixed color when the hand has no colored cards', () => {
    expect(decideWildColor([card(null, 'wild')])).toBe('red')
  })
})

describe('decideSwapTarget', () => {
  it('targets the opponent with the fewest cards', () => {
    const state = makeState({
      players: [
        makePlayer('bot1', [card('red', '1'), card('red', '2'), card('red', '3')]),
        makePlayer('p2', [card('blue', '1')]),
        makePlayer('p3', [card('green', '1'), card('green', '2')]),
      ],
      discardPile: [card('red', '5')],
    })
    expect(decideSwapTarget(state, 'bot1')).toBe('p2')
  })
})

describe('decideBotMove', () => {
  it('draws when no card is playable', () => {
    const state = makeState({
      players: [makePlayer('bot1', [card('blue', '9')]), makePlayer('p2', [])],
      discardPile: [card('red', '2')],
      activeColor: 'red',
      currentPlayerIndex: 0,
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision).toEqual({ type: 'draw' })
  })

  it('plays a legal card when one exists', () => {
    const matching = card('red', '9')
    const state = makeState({
      players: [makePlayer('bot1', [matching]), makePlayer('p2', [])],
      discardPile: [card('red', '2')],
      activeColor: 'red',
      currentPlayerIndex: 0,
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision).toEqual({ type: 'play', card: matching, chosenColor: undefined, swapTargetId: undefined })
  })

  it('prefers shedding the highest number card when no one is threatened', () => {
    const low = card('red', '2')
    const high = card('red', '8')
    const state = makeState({
      players: [
        makePlayer('bot1', [low, high]),
        makePlayer('p2', [card('blue', '1'), card('blue', '2'), card('blue', '3'), card('blue', '4')]),
      ],
      discardPile: [card('red', '2')],
      activeColor: 'red',
      currentPlayerIndex: 0,
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision).toMatchObject({ type: 'play', card: high })
  })

  it('prefers an action card over a number card when the next player is threatened (≤3 cards)', () => {
    const numberCard = card('red', '8')
    const drawTwo = card('red', 'draw2')
    const state = makeState({
      players: [
        makePlayer('bot1', [numberCard, drawTwo]),
        makePlayer('p2', [card('blue', '1'), card('blue', '2')]), // threatened: 2 cards left
      ],
      discardPile: [card('red', '2')],
      activeColor: 'red',
      currentPlayerIndex: 0,
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision).toMatchObject({ type: 'play', card: drawTwo })
  })

  it('picks a chosen color for a wild play', () => {
    const wild = card(null, 'wild')
    const state = makeState({
      players: [makePlayer('bot1', [wild, card('green', '3'), card('green', '4')]), makePlayer('p2', [])],
      discardPile: [card('red', '2')],
      activeColor: 'red',
      currentPlayerIndex: 0,
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision.type).toBe('play')
    if (decision.type === 'play') expect(decision.chosenColor).toBe('green')
  })

  it('during a pending draw, stacks a legal card when the variant allows it', () => {
    const stackable = card('blue', 'draw2')
    const state = makeState({
      players: [makePlayer('bot1', [stackable]), makePlayer('p2', [])],
      discardPile: [card('red', 'draw2')],
      pendingDrawCount: 2,
      pendingDrawType: 'draw2',
      variants: withVariants({ stacking: 'draw2-only' }),
      currentPlayerIndex: 0,
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision).toMatchObject({ type: 'play', card: stackable })
  })

  it('during a pending draw, draws when stacking is off', () => {
    const wouldStack = card('blue', 'draw2')
    const state = makeState({
      players: [makePlayer('bot1', [wouldStack]), makePlayer('p2', [])],
      discardPile: [card('red', 'draw2')],
      pendingDrawCount: 2,
      pendingDrawType: 'draw2',
      variants: withVariants({ stacking: 'off' }),
      currentPlayerIndex: 0,
    })
    expect(decideBotMove(state, 'bot1')).toEqual({ type: 'draw' })
  })

  it('picks a swap target for a 7 when the sevenZero variant is on', () => {
    const seven = card('red', '7')
    const state = makeState({
      players: [
        makePlayer('bot1', [seven]),
        makePlayer('p2', [card('blue', '1')]),
        makePlayer('p3', [card('green', '1'), card('green', '2')]),
      ],
      discardPile: [card('red', '2')],
      activeColor: 'red',
      currentPlayerIndex: 0,
      variants: withVariants({ sevenZero: true }),
    })
    const decision = decideBotMove(state, 'bot1')
    expect(decision.type).toBe('play')
    if (decision.type === 'play') expect(decision.swapTargetId).toBe('p2')
  })
})

describe('decideJumpIn', () => {
  it('always returns null — bots never proactively jump in for this difficulty tier', () => {
    const state = makeState({
      players: [makePlayer('bot1', [card('red', '5')])],
      discardPile: [card('red', '5')],
      variants: withVariants({ jumpIn: true }),
    })
    expect(decideJumpIn(state, 'bot1')).toBeNull()
  })
})
