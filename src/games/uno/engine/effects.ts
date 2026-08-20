import type { Card, Color, GameState } from './types'
import { advanceTurn } from './turn'

function removeCardFromHand(state: GameState, playerId: string, cardId: string): GameState {
  const players = state.players.map((p) =>
    p.id === playerId ? { ...p, hand: p.hand.filter((c) => c.id !== cardId) } : p,
  )
  return { ...state, players }
}

// Resets the "called Uno" flag whenever a player's hand size moves away
// from one. Actually calling Uno is always an explicit CALL_UNO action —
// including for bots, whose turn-loop dispatches it right after playing —
// so this pure engine module stays free of any bot/human distinction.
function withUnoBookkeeping(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!
  if (player.hand.length === 1 || !player.calledUno) return state
  const players = state.players.map((p) => (p.id === playerId ? { ...p, calledUno: false } : p))
  return { ...state, players }
}

function checkWin(state: GameState, playerId: string): GameState {
  const player = state.players.find((p) => p.id === playerId)!
  if (player.hand.length !== 0) return state
  return { ...state, status: 'won', winnerId: playerId, log: [...state.log, { type: 'won', playerId }] }
}

export function applySkip(state: GameState): GameState {
  const skippedIndex = (state.currentPlayerIndex + state.direction + state.players.length) % state.players.length
  const skippedId = state.players[skippedIndex].id
  return advanceTurn(
    { ...state, log: [...state.log, { type: 'skipped', playerId: skippedId }] },
    2,
  )
}

export function applyReverse(state: GameState): GameState {
  const reversed: GameState = {
    ...state,
    direction: (state.direction * -1) as 1 | -1,
    log: [...state.log, { type: 'reversed' }],
  }
  // In a 2-player game, reverse behaves like skip since it just bounces back.
  const steps = state.players.length === 2 ? 2 : 1
  return advanceTurn(reversed, steps)
}

export function applyDrawTwo(state: GameState): GameState {
  const withPending: GameState = {
    ...state,
    pendingDrawCount: state.pendingDrawCount + 2,
    pendingDrawType: 'draw2',
  }
  return advanceTurn(withPending)
}

export function applyWildDrawFour(state: GameState): GameState {
  const withPending: GameState = {
    ...state,
    pendingDrawCount: state.pendingDrawCount + 4,
    pendingDrawType: 'draw4',
  }
  return advanceTurn(withPending)
}

export function applySeven(state: GameState, playerId: string, swapTargetId: string): GameState {
  const players = state.players.map((p) => {
    if (p.id === playerId) return { ...p, hand: state.players.find((x) => x.id === swapTargetId)!.hand }
    if (p.id === swapTargetId) return { ...p, hand: state.players.find((x) => x.id === playerId)!.hand }
    return p
  })
  return advanceTurn({
    ...state,
    players,
    log: [...state.log, { type: 'swapped', playerId, withPlayerId: swapTargetId }],
  })
}

export function applyZero(state: GameState): GameState {
  const count = state.players.length
  const hands = state.players.map((p) => p.hand)
  const players = state.players.map((p, i) => {
    // Each player passes their hand to the next seat, in the current
    // direction of play.
    const fromIndex = (i - state.direction + count) % count
    return { ...p, hand: hands[fromIndex] }
  })
  return advanceTurn({ ...state, players, log: [...state.log, { type: 'rotated' as const }] })
}

export interface PlayCardOptions {
  chosenColor?: Color
  swapTargetId?: string
}

/**
 * Central entry point: removes `card` from the player's hand, resolves its
 * effect (skip/reverse/draw stacking/wild color/7-0), and returns the fully
 * updated, turn-advanced GameState. Pure — never mutates its input.
 */
export function applyCardEffect(
  state: GameState,
  playerId: string,
  card: Card,
  options: PlayCardOptions = {},
): GameState {
  const isWildCard = card.value === 'wild' || card.value === 'wild-draw4'
  let next = removeCardFromHand(state, playerId, card.id)
  next = { ...next, discardPile: [...next.discardPile, card] }
  next = { ...next, activeColor: card.color ?? options.chosenColor ?? next.activeColor }
  next = { ...next, log: [...next.log, { type: 'played', playerId, card }] }
  if (isWildCard) {
    next = { ...next, log: [...next.log, { type: 'colorChosen', playerId, color: next.activeColor }] }
  }
  next = withUnoBookkeeping(next, playerId)
  next = checkWin(next, playerId)

  if (next.status === 'won') return next

  switch (card.value) {
    case 'skip':
      return applySkip(next)
    case 'reverse':
      return applyReverse(next)
    case 'draw2':
      return applyDrawTwo(next)
    case 'wild-draw4':
      return applyWildDrawFour(next)
    case 'wild':
      return advanceTurn(next)
    case '7':
      if (next.variants.sevenZero && options.swapTargetId) {
        return applySeven(next, playerId, options.swapTargetId)
      }
      return advanceTurn(next)
    case '0':
      if (next.variants.sevenZero) {
        return applyZero(next)
      }
      return advanceTurn(next)
    default:
      return advanceTurn(next)
  }
}
