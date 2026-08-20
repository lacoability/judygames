import type { Card, GameState } from './types'

/** Whether `card` can legally answer an in-progress stacked draw penalty. */
export function canStack(card: Card, state: GameState): boolean {
  if (state.pendingDrawCount === 0 || !state.pendingDrawType) return false
  const { stacking } = state.variants
  if (stacking === 'off') return false

  if (state.pendingDrawType === 'draw2') {
    if (card.value === 'draw2') return true
    if (card.value === 'wild-draw4' && stacking === 'draw2-and-draw4-cross-stack') return true
    return false
  }

  // pendingDrawType === 'draw4': a +4 stays maximally severe, so it can only
  // ever be answered by another +4, and only in the cross-stack mode.
  return stacking === 'draw2-and-draw4-cross-stack' && card.value === 'wild-draw4'
}

/**
 * Structural legality check against the current top card / active color.
 * Does NOT enforce the "no matching color in hand" restriction on Wild Draw
 * Four — that needs full-hand context and lives in `getPlayableCards`.
 */
export function isValidPlay(card: Card, topCard: Card, state: GameState): boolean {
  if (state.pendingDrawCount > 0) {
    return canStack(card, state)
  }
  if (card.value === 'wild' || card.value === 'wild-draw4') return true
  if (card.color === state.activeColor) return true
  if (card.value === topCard.value) return true
  return false
}

export function getPlayableCards(hand: Card[], state: GameState): Card[] {
  const topCard = state.discardPile[state.discardPile.length - 1]
  return hand.filter((card) => {
    if (!isValidPlay(card, topCard, state)) return false
    if (card.value === 'wild-draw4' && state.pendingDrawCount === 0) {
      const hasMatchingColor = hand.some((c) => c.id !== card.id && c.color === state.activeColor)
      return !hasMatchingColor
    }
    return true
  })
}

/** Jump-in requires an exact color+value match to the current top card. */
export function isJumpInEligible(card: Card, state: GameState): boolean {
  if (!state.variants.jumpIn) return false
  const topCard = state.discardPile[state.discardPile.length - 1]
  return card.color === topCard.color && card.value === topCard.value
}
