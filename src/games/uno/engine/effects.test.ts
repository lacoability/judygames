import { describe, expect, it } from 'vitest'
import { applyCardEffect, applyReverse, applySkip } from './effects'
import { card, makePlayer, makeState, withVariants } from './testHelpers'

describe('applyCardEffect: numbers', () => {
  it('moves the card to the discard pile and advances to the next player', () => {
    const played = card('red', '7')
    const spare = card('red', '1')
    const state = makeState({
      players: [makePlayer('p1', [played, spare]), makePlayer('p2', []), makePlayer('p3', [])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = applyCardEffect(state, 'p1', played)
    expect(next.discardPile.at(-1)).toEqual(played)
    expect(next.players[0].hand).toEqual([spare])
    expect(next.currentPlayerIndex).toBe(1)
  })
})

describe('applySkip', () => {
  it('advances two seats, skipping the immediate next player', () => {
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p2', []), makePlayer('p3', [])],
      currentPlayerIndex: 0,
    })
    const next = applySkip(state)
    expect(next.currentPlayerIndex).toBe(2)
    expect(next.log.at(-1)).toMatchObject({ type: 'skipped', playerId: 'p2' })
  })
})

describe('applyReverse', () => {
  it('flips direction and moves to the previous seat in a 4-player game', () => {
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p2', []), makePlayer('p3', []), makePlayer('p4', [])],
      currentPlayerIndex: 0,
      direction: 1,
    })
    const next = applyReverse(state)
    expect(next.direction).toBe(-1)
    expect(next.currentPlayerIndex).toBe(3)
  })

  it('acts like a skip (same player goes again) in a 2-player game', () => {
    const state = makeState({
      players: [makePlayer('p1', []), makePlayer('p2', [])],
      currentPlayerIndex: 0,
      direction: 1,
    })
    const next = applyReverse(state)
    expect(next.currentPlayerIndex).toBe(0)
  })
})

describe('applyCardEffect: draw stacking', () => {
  it('accumulates pendingDrawCount when a second draw2 is chained', () => {
    const d2a = card('red', 'draw2')
    const d2b = card('blue', 'draw2')
    const state = makeState({
      players: [
        makePlayer('p1', [d2a, card('red', '1')]),
        makePlayer('p2', [d2b, card('blue', '1')]),
        makePlayer('p3', []),
      ],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
      variants: withVariants({ stacking: 'draw2-only' }),
    })
    const afterFirst = applyCardEffect(state, 'p1', d2a)
    expect(afterFirst.pendingDrawCount).toBe(2)
    expect(afterFirst.currentPlayerIndex).toBe(1)

    const afterSecond = applyCardEffect(afterFirst, 'p2', d2b)
    expect(afterSecond.pendingDrawCount).toBe(4)
    expect(afterSecond.pendingDrawType).toBe('draw2')
    expect(afterSecond.currentPlayerIndex).toBe(2)
  })
})

describe('applyCardEffect: wild', () => {
  it('sets the active color to the chosen color and logs it', () => {
    const wild = card(null, 'wild')
    const state = makeState({
      players: [makePlayer('p1', [wild]), makePlayer('p2', [])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = applyCardEffect(state, 'p1', wild, { chosenColor: 'blue' })
    expect(next.activeColor).toBe('blue')
    expect(next.log.some((e) => e.type === 'colorChosen' && e.color === 'blue')).toBe(true)
  })
})

describe('applyCardEffect: 7-0 rule', () => {
  it('7 swaps hands with the chosen target when the variant is enabled', () => {
    const seven = card('red', '7')
    const p1Spare = card('red', '1')
    const p2Hand = [card('blue', '2'), card('green', '4')]
    const state = makeState({
      players: [makePlayer('p1', [seven, p1Spare]), makePlayer('p2', p2Hand)],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
      variants: withVariants({ sevenZero: true }),
    })
    const next = applyCardEffect(state, 'p1', seven, { swapTargetId: 'p2' })
    expect(next.players.find((p) => p.id === 'p1')!.hand).toEqual(p2Hand)
    expect(next.players.find((p) => p.id === 'p2')!.hand).toEqual([p1Spare])
  })

  it('0 rotates all hands forward in the current direction', () => {
    const zero = card('red', '0')
    const p1Spare = card('red', '1')
    const p1Hand = [zero, p1Spare]
    const p2Hand = [card('blue', '2')]
    const p3Hand = [card('green', '4')]
    const state = makeState({
      players: [makePlayer('p1', p1Hand), makePlayer('p2', p2Hand), makePlayer('p3', p3Hand)],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
      direction: 1,
      variants: withVariants({ sevenZero: true }),
    })
    const next = applyCardEffect(state, 'p1', zero)
    // Everyone passes their hand forward to the next seat in the direction
    // of play: p1 (now just the spare) -> p2, p2 -> p3, p3 -> p1.
    expect(next.players.find((p) => p.id === 'p2')!.hand).toEqual([p1Spare])
    expect(next.players.find((p) => p.id === 'p3')!.hand).toEqual(p2Hand)
    expect(next.players.find((p) => p.id === 'p1')!.hand).toEqual(p3Hand)
  })
})

describe('applyCardEffect: win detection', () => {
  it('sets status to won when the last card is played', () => {
    const lastCard = card('red', '7')
    const state = makeState({
      players: [makePlayer('p1', [lastCard]), makePlayer('p2', [])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = applyCardEffect(state, 'p1', lastCard)
    expect(next.status).toBe('won')
    expect(next.winnerId).toBe('p1')
  })
})

describe('applyCardEffect: uno bookkeeping', () => {
  it('never auto-calls uno — dropping to one card leaves calledUno false regardless of isBot', () => {
    const card1 = card('red', '7')
    const state = makeState({
      players: [
        makePlayer('bot1', [card1, card('blue', '2')], { isBot: true }),
        makePlayer('p2', []),
      ],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
    })
    const next = applyCardEffect(state, 'bot1', card1)
    expect(next.players.find((p) => p.id === 'bot1')!.calledUno).toBe(false)
  })

  it('resets a stale calledUno flag once the hand grows past one card again', () => {
    const card1 = card('red', '7')
    const card2 = card('blue', '2')
    const state = makeState({
      players: [makePlayer('p1', [card1, card2], { calledUno: true }), makePlayer('p2', [])],
      discardPile: [card('red', '3')],
      currentPlayerIndex: 0,
      drawPile: [card('green', '1')],
    })
    // Playing one of two cards still leaves a 1-card hand, so a prior call stays valid...
    const next = applyCardEffect(state, 'p1', card1)
    expect(next.players.find((p) => p.id === 'p1')!.hand).toHaveLength(1)
    expect(next.players.find((p) => p.id === 'p1')!.calledUno).toBe(true)
  })
})
