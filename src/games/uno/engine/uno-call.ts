import type { GameState } from './types'
import { drawForPlayer } from './turn'

const UNO_PENALTY_CARDS = 2

export function checkUnoCallRequired(state: GameState, playerId: string): boolean {
  const player = state.players.find((p) => p.id === playerId)
  return !!player && player.hand.length === 1 && !player.calledUno
}

export function callUno(state: GameState, playerId: string): GameState {
  const players = state.players.map((p) => (p.id === playerId ? { ...p, calledUno: true } : p))
  return { ...state, players, log: [...state.log, { type: 'calledUno', playerId }] }
}

/**
 * A player (usually the human, since bots don't act outside their own turn
 * for MVP — see the jump-in simplification) catches an opponent sitting on
 * one card without having called Uno.
 */
export function checkUnoPenalty(state: GameState, accusedId: string): GameState {
  const accused = state.players.find((p) => p.id === accusedId)
  if (!accused || accused.hand.length !== 1 || accused.calledUno) return state

  const penalized = drawForPlayer(state, accusedId, UNO_PENALTY_CARDS)
  return {
    ...penalized,
    log: [...penalized.log, { type: 'unoPenalty', playerId: accusedId, count: UNO_PENALTY_CARDS }],
  }
}
