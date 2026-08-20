import type { Card, GameState } from './types'

export function nextPlayerIndex(state: GameState, from = state.currentPlayerIndex): number {
  const count = state.players.length
  return (from + state.direction + count) % count
}

/** Advances the current player by `steps` seats (2 = skip one player). */
export function advanceTurn(state: GameState, steps = 1): GameState {
  let index = state.currentPlayerIndex
  for (let i = 0; i < steps; i++) {
    index = nextPlayerIndex(state, index)
  }
  return { ...state, currentPlayerIndex: index }
}

function drawCards(deck: Card[], discard: Card[], count: number): { drawn: Card[]; deck: Card[]; discard: Card[] } {
  let workingDeck = deck
  let workingDiscard = discard
  const drawn: Card[] = []

  for (let i = 0; i < count; i++) {
    if (workingDeck.length === 0) {
      // Reshuffle the discard pile (keeping its top card in play) back into
      // the draw pile once it's exhausted.
      const top = workingDiscard[workingDiscard.length - 1]
      const rest = workingDiscard.slice(0, -1)
      if (rest.length === 0) break // nothing left anywhere; stop drawing
      workingDeck = rest
      workingDiscard = [top]
    }
    drawn.push(workingDeck[0])
    workingDeck = workingDeck.slice(1)
  }

  return { drawn, deck: workingDeck, discard: workingDiscard }
}

export function drawForPlayer(state: GameState, playerId: string, count: number): GameState {
  const { drawn, deck, discard } = drawCards(state.drawPile, state.discardPile, count)
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, hand: [...p.hand, ...drawn], calledUno: false } : p,
  )
  return {
    ...state,
    players,
    drawPile: deck,
    discardPile: discard,
    log: [...state.log, { type: 'drew', playerId, count: drawn.length }],
  }
}

/** Resolves an accumulated draw-card stack: the player draws it all and loses their turn. */
export function resolvePendingDraw(state: GameState, playerId: string): GameState {
  const count = state.pendingDrawCount
  let next = drawForPlayer(state, playerId, count)
  next = { ...next, pendingDrawCount: 0, pendingDrawType: null }
  return advanceTurn(next)
}
