import { describe, expect, it } from 'vitest'
import { gameReducer } from './gameReducer'
import { card, makePlayer, makeState, withVariants } from './testHelpers'

describe('gameReducer PLAY_CARD', () => {
  it('rejects a play from a player who is not current', () => {
    const c = card('red', '7')
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p2', [c])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = gameReducer(state, { type: 'PLAY_CARD', playerId: 'p2', card: c })
    expect(next).toBe(state)
  })

  it('rejects an illegal card', () => {
    const c = card('blue', '9')
    const state = makeState({
      players: [makePlayer('p1', [c])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = gameReducer(state, { type: 'PLAY_CARD', playerId: 'p1', card: c })
    expect(next).toBe(state)
  })

  it('rejects a wild play with no chosen color', () => {
    const w = card(null, 'wild')
    const state = makeState({
      players: [makePlayer('p1', [w])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = gameReducer(state, { type: 'PLAY_CARD', playerId: 'p1', card: w })
    expect(next).toBe(state)
  })

  it('accepts a legal play and advances the turn', () => {
    const c = card('red', '7')
    const state = makeState({
      players: [makePlayer('p1', [c, card('red', '1')]), makePlayer('p2', [])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = gameReducer(state, { type: 'PLAY_CARD', playerId: 'p1', card: c })
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.discardPile.at(-1)).toEqual(c)
  })
})

describe('gameReducer DRAW_CARD', () => {
  it('draws one card and ends the turn when nothing is pending', () => {
    const drawPile = [card('green', '4')]
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p2', [])],
      discardPile: [card('red', '3')],
      drawPile,
      currentPlayerIndex: 0,
    })
    const next = gameReducer(state, { type: 'DRAW_CARD', playerId: 'p1' })
    expect(next.players[0].hand).toHaveLength(1)
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.drawPile).toHaveLength(0)
  })

  it('forces the full pending stack and skips the turn', () => {
    const drawPile = [card('green', '1'), card('green', '2'), card('green', '3'), card('green', '4')]
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p2', [])],
      discardPile: [card('red', 'draw2')],
      drawPile,
      currentPlayerIndex: 0,
      pendingDrawCount: 4,
      pendingDrawType: 'draw2',
    })
    const next = gameReducer(state, { type: 'DRAW_CARD', playerId: 'p1' })
    expect(next.players[0].hand).toHaveLength(4)
    expect(next.pendingDrawCount).toBe(0)
    expect(next.pendingDrawType).toBeNull()
    expect(next.currentPlayerIndex).toBe(1)
  })
})

describe('gameReducer CALL_UNO / CHALLENGE_UNO', () => {
  it('lets a player call uno at one card', () => {
    const state = makeState({
      players: [makePlayer('p1', [card('red', '5')])],
      discardPile: [card('red', '3')],
    })
    const next = gameReducer(state, { type: 'CALL_UNO', playerId: 'p1' })
    expect(next.players[0].calledUno).toBe(true)
  })

  it('penalizes a player caught at one card without calling uno', () => {
    const state = makeState({
      players: [makePlayer('p1', [card('red', '5')])],
      discardPile: [card('red', '3')],
      drawPile: [card('blue', '1'), card('blue', '2')],
    })
    const next = gameReducer(state, { type: 'CHALLENGE_UNO', accusedId: 'p1' })
    expect(next.players[0].hand).toHaveLength(3)
  })

  it('does not penalize a player who already called uno', () => {
    const state = makeState({
      players: [makePlayer('p1', [card('red', '5')], { calledUno: true })],
      discardPile: [card('red', '3')],
      drawPile: [card('blue', '1'), card('blue', '2')],
    })
    const next = gameReducer(state, { type: 'CHALLENGE_UNO', accusedId: 'p1' })
    expect(next.players[0].hand).toHaveLength(1)
  })
})

describe('gameReducer JUMP_IN', () => {
  it('lets an out-of-turn player jump in with an exact match, then play continues after them', () => {
    const topCard = card('red', '5')
    const jumpCard = card('red', '5')
    const state = makeState({
      players: [
        makePlayer('p1', []),
        makePlayer('p2', []),
        makePlayer('p3', [jumpCard, card('blue', '1')]),
      ],
      discardPile: [topCard],
      currentPlayerIndex: 0,
      variants: withVariants({ jumpIn: true }),
    })
    const next = gameReducer(state, { type: 'JUMP_IN', playerId: 'p3', card: jumpCard })
    expect(next.discardPile.at(-1)).toEqual(jumpCard)
    // p3 jumped in, so play continues from the seat after p3 (index 0, wrapping).
    expect(next.currentPlayerIndex).toBe(0)
  })

  it('rejects a jump-in when the variant is disabled', () => {
    const topCard = card('red', '5')
    const jumpCard = card('red', '5')
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p3', [jumpCard])],
      discardPile: [topCard],
      currentPlayerIndex: 0,
      variants: withVariants({ jumpIn: false }),
    })
    const next = gameReducer(state, { type: 'JUMP_IN', playerId: 'p3', card: jumpCard })
    expect(next).toBe(state)
  })
})

describe('gameReducer: no-op once the game is won', () => {
  it('ignores further actions', () => {
    const state = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [card('red', '3')],
      status: 'won',
      winnerId: 'p1',
    })
    const next = gameReducer(state, { type: 'DRAW_CARD', playerId: 'p1' })
    expect(next).toBe(state)
  })
})
