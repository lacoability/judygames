import type { Card, Color, GameState } from './types'
import { getPlayableCards, isJumpInEligible } from './rules'
import { applyCardEffect } from './effects'
import { drawForPlayer, resolvePendingDraw, advanceTurn } from './turn'
import { callUno, checkUnoPenalty } from './uno-call'

export type GameAction =
  | { type: 'PLAY_CARD'; playerId: string; card: Card; chosenColor?: Color; swapTargetId?: string }
  | { type: 'DRAW_CARD'; playerId: string }
  | { type: 'CALL_UNO'; playerId: string }
  | { type: 'CHALLENGE_UNO'; accusedId: string }
  | { type: 'JUMP_IN'; playerId: string; card: Card; chosenColor?: Color }

function currentPlayer(state: GameState) {
  return state.players[state.currentPlayerIndex]
}

/**
 * The single entry point the UI and bot AI both dispatch through. Invalid
 * actions (wrong turn, illegal card, etc.) are no-ops — the reducer returns
 * `state` unchanged rather than throwing, since the UI is expected to only
 * ever offer legal moves via `getPlayableCards`.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status === 'won') return state

  switch (action.type) {
    case 'PLAY_CARD': {
      const player = state.players.find((p) => p.id === action.playerId)
      if (!player || currentPlayer(state).id !== action.playerId) return state
      const inHand = player.hand.some((c) => c.id === action.card.id)
      if (!inHand) return state
      const playable = getPlayableCards(player.hand, state)
      if (!playable.some((c) => c.id === action.card.id)) return state

      const isWild = action.card.value === 'wild' || action.card.value === 'wild-draw4'
      if (isWild && !action.chosenColor) return state
      if (action.card.value === '7' && state.variants.sevenZero && !action.swapTargetId) return state

      return applyCardEffect(state, action.playerId, action.card, {
        chosenColor: action.chosenColor,
        swapTargetId: action.swapTargetId,
      })
    }

    case 'DRAW_CARD': {
      if (currentPlayer(state).id !== action.playerId) return state
      if (state.pendingDrawCount > 0) {
        return resolvePendingDraw(state, action.playerId)
      }
      return advanceTurn(drawForPlayer(state, action.playerId, 1))
    }

    case 'CALL_UNO': {
      const player = state.players.find((p) => p.id === action.playerId)
      if (!player || player.hand.length !== 1 || player.calledUno) return state
      return callUno(state, action.playerId)
    }

    case 'CHALLENGE_UNO': {
      return checkUnoPenalty(state, action.accusedId)
    }

    case 'JUMP_IN': {
      const player = state.players.find((p) => p.id === action.playerId)
      if (!player) return state
      if (state.pendingDrawCount > 0) return state
      if (!isJumpInEligible(action.card, state)) return state
      const inHand = player.hand.some((c) => c.id === action.card.id)
      if (!inHand) return state
      const isWild = action.card.value === 'wild' || action.card.value === 'wild-draw4'
      if (isWild && !action.chosenColor) return state

      const jumpIndex = state.players.findIndex((p) => p.id === action.playerId)
      const relocated: GameState = {
        ...state,
        currentPlayerIndex: jumpIndex,
        log: [...state.log, { type: 'jumpedIn', playerId: action.playerId, card: action.card }],
      }
      return applyCardEffect(relocated, action.playerId, action.card, { chosenColor: action.chosenColor })
    }

    default:
      return state
  }
}
