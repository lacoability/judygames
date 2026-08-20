import { describe, expect, it } from 'vitest'
import { canStack, getPlayableCards, isJumpInEligible, isValidPlay } from './rules'
import { card, makePlayer, makeState, withVariants } from './testHelpers'

describe('isValidPlay', () => {
  it('allows a color match', () => {
    const top = card('red', '5')
    const state = makeState({ players: [makePlayer('p1', [])], discardPile: [top] })
    expect(isValidPlay(card('red', '9'), top, state)).toBe(true)
  })

  it('allows a value match across colors', () => {
    const top = card('red', 'skip')
    const state = makeState({ players: [makePlayer('p1', [])], discardPile: [top] })
    expect(isValidPlay(card('blue', 'skip'), top, state)).toBe(true)
  })

  it('rejects a non-matching color and value', () => {
    const top = card('red', '5')
    const state = makeState({ players: [makePlayer('p1', [])], discardPile: [top] })
    expect(isValidPlay(card('blue', '9'), top, state)).toBe(false)
  })

  it('always allows wild and wild-draw4 when no draw is pending', () => {
    const top = card('red', '5')
    const state = makeState({ players: [makePlayer('p1', [])], discardPile: [top] })
    expect(isValidPlay(card(null, 'wild'), top, state)).toBe(true)
    expect(isValidPlay(card(null, 'wild-draw4'), top, state)).toBe(true)
  })

  it('during a pending draw, only stackable cards are valid', () => {
    const top = card('red', 'draw2')
    const state = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [top],
      pendingDrawCount: 2,
      pendingDrawType: 'draw2',
      variants: withVariants({ stacking: 'draw2-only' }),
    })
    expect(isValidPlay(card('blue', 'draw2'), top, state)).toBe(true)
    expect(isValidPlay(card('blue', '5'), top, state)).toBe(false)
    expect(isValidPlay(card(null, 'wild'), top, state)).toBe(false)
  })
})

describe('canStack', () => {
  const top = card('red', 'draw2')

  it('is false when stacking is off', () => {
    const state = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [top],
      pendingDrawCount: 2,
      pendingDrawType: 'draw2',
      variants: withVariants({ stacking: 'off' }),
    })
    expect(canStack(card('blue', 'draw2'), state)).toBe(false)
  })

  it('draw2-only: a draw2 stacks on draw2, a wild-draw4 does not', () => {
    const state = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [top],
      pendingDrawCount: 2,
      pendingDrawType: 'draw2',
      variants: withVariants({ stacking: 'draw2-only' }),
    })
    expect(canStack(card('blue', 'draw2'), state)).toBe(true)
    expect(canStack(card(null, 'wild-draw4'), state)).toBe(false)
  })

  it('cross-stack: a wild-draw4 can answer a draw2, but not vice versa', () => {
    const onDraw2 = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [top],
      pendingDrawCount: 2,
      pendingDrawType: 'draw2',
      variants: withVariants({ stacking: 'draw2-and-draw4-cross-stack' }),
    })
    expect(canStack(card(null, 'wild-draw4'), onDraw2)).toBe(true)

    const onDraw4 = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [card(null, 'wild-draw4')],
      pendingDrawCount: 4,
      pendingDrawType: 'draw4',
      variants: withVariants({ stacking: 'draw2-and-draw4-cross-stack' }),
    })
    expect(canStack(card('blue', 'draw2'), onDraw4)).toBe(false)
    expect(canStack(card(null, 'wild-draw4'), onDraw4)).toBe(true)
  })
})

describe('getPlayableCards', () => {
  it('restricts wild-draw4 to when no other card in hand matches the active color', () => {
    const top = card('green', '3')
    const wild4 = card(null, 'wild-draw4')
    const redCard = card('red', '7')
    const hand = [wild4, redCard]
    const state = makeState({
      players: [makePlayer('p1', hand)],
      discardPile: [top],
      activeColor: 'green',
    })
    // Hand has no green card, so wild-draw4 is legal.
    expect(getPlayableCards(hand, state).map((c) => c.id)).toContain(wild4.id)
  })

  it('excludes wild-draw4 when a matching color card is available', () => {
    const top = card('green', '3')
    const wild4 = card(null, 'wild-draw4')
    const greenCard = card('green', '7')
    const hand = [wild4, greenCard]
    const state = makeState({
      players: [makePlayer('p1', hand)],
      discardPile: [top],
      activeColor: 'green',
    })
    const playable = getPlayableCards(hand, state).map((c) => c.id)
    expect(playable).not.toContain(wild4.id)
    expect(playable).toContain(greenCard.id)
  })
})

describe('isJumpInEligible', () => {
  it('requires the jump-in variant to be enabled', () => {
    const top = card('red', '5')
    const state = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [top],
      variants: withVariants({ jumpIn: false }),
    })
    expect(isJumpInEligible(card('red', '5'), state)).toBe(false)
  })

  it('requires an exact color and value match', () => {
    const top = card('red', '5')
    const state = makeState({
      players: [makePlayer('p1', [])],
      discardPile: [top],
      variants: withVariants({ jumpIn: true }),
    })
    expect(isJumpInEligible(card('red', '5'), state)).toBe(true)
    expect(isJumpInEligible(card('blue', '5'), state)).toBe(false)
    expect(isJumpInEligible(card('red', '6'), state)).toBe(false)
  })
})
