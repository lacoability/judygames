import type { Card, GameState, RNG, ShowStageName } from './types'
import { applyGo, applyPegPlay, getPlayer, legalPeggingCards, otherPlayerId } from './pegging'
import { hasWon, scoreHand } from './scoring'
import { dealNextHand } from './deal'

export type GameAction =
  | { type: 'CONFIRM_DISCARD'; playerId: string; cardIds: [string, string] }
  | { type: 'PLAY_PEG_CARD'; playerId: string; card: Card }
  | { type: 'SAY_GO'; playerId: string }
  | { type: 'START_NEXT_HAND'; rng?: RNG }

/** Moves both staged discards into the crib, cuts the starter, applies "his heels", and opens pegging. */
function resolveDiscardComplete(state: GameState): GameState {
  const next: GameState = structuredClone(state)

  for (const p of next.players) {
    const discard = next.pendingDiscards[p.id]!
    next.crib.push(...discard)
    p.hand = p.hand.filter((c) => !discard.some((d) => d.id === c.id))
    p.peggingHand = [...p.hand]
  }
  next.pendingDiscards = {}

  const [starter, ...restDeck] = next.deck
  next.starter = starter
  next.deck = restDeck
  next.log.push({ type: 'starterCut', card: starter })

  if (starter.rank === 'J') {
    next.scores[next.dealerId] += 2
    next.log.push({ type: 'hisHeels', playerId: next.dealerId })
    if (hasWon(next.scores[next.dealerId])) {
      next.status = 'won'
      next.winnerId = next.dealerId
      next.phase = 'gameOver'
      next.log.push({ type: 'won', playerId: next.dealerId })
      return next
    }
  }

  next.phase = 'pegging'
  next.pegging = { sequence: [], count: 0, stuck: [], turnPlayerId: otherPlayerId(next, next.dealerId) }
  return next
}

/**
 * Scores non-dealer's hand, then dealer's hand, then the crib (always the
 * dealer's), in that order — stopping the instant a score crosses 121, per
 * the real "first to peg 121 wins" rule. Whatever stages were reached stay
 * on `showStages` for the UI to reveal one at a time.
 */
function resolveShow(state: GameState): GameState {
  const next: GameState = structuredClone(state)
  const dealerId = next.dealerId
  const nonDealerId = otherPlayerId(next, dealerId)
  const starter = next.starter!

  const stages: { name: ShowStageName; playerId: string; cards: Card[]; isCrib: boolean }[] = [
    { name: 'nonDealer', playerId: nonDealerId, cards: getPlayer(next, nonDealerId).hand, isCrib: false },
    { name: 'dealer', playerId: dealerId, cards: getPlayer(next, dealerId).hand, isCrib: false },
    { name: 'crib', playerId: dealerId, cards: next.crib, isCrib: true },
  ]

  for (const stage of stages) {
    const result = scoreHand(stage.cards, starter, stage.isCrib)
    next.showStages.push({ name: stage.name, playerId: stage.playerId, cards: stage.cards, starter, result })

    if (result.total > 0) {
      next.scores[stage.playerId] += result.total
      next.log.push({ type: 'showScored', stage: stage.name, playerId: stage.playerId, points: result.total })
    }
    if (hasWon(next.scores[stage.playerId])) {
      next.status = 'won'
      next.winnerId = stage.playerId
      next.phase = 'gameOver'
      next.log.push({ type: 'won', playerId: stage.playerId })
      break
    }
  }

  return next
}

/**
 * The single entry point the UI and bot AI both dispatch through. Invalid
 * actions (wrong phase, wrong turn, illegal card, etc.) are no-ops — the
 * reducer returns `state` unchanged, since the UI is expected to only ever
 * offer legal moves.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status === 'won') return state

  switch (action.type) {
    case 'CONFIRM_DISCARD': {
      if (state.phase !== 'discard') return state
      const player = state.players.find((p) => p.id === action.playerId)
      if (!player) return state
      if (state.pendingDiscards[action.playerId]) return state // already confirmed

      const [id1, id2] = action.cardIds
      if (id1 === id2) return state
      const c1 = player.hand.find((c) => c.id === id1)
      const c2 = player.hand.find((c) => c.id === id2)
      if (!c1 || !c2) return state

      const next: GameState = structuredClone(state)
      next.pendingDiscards[action.playerId] = [c1, c2]
      next.log.push({ type: 'discarded', playerId: action.playerId })

      const otherId = otherPlayerId(next, action.playerId)
      if (!next.pendingDiscards[otherId]) return next // waiting on the other player

      return resolveDiscardComplete(next)
    }

    case 'PLAY_PEG_CARD': {
      if (state.phase !== 'pegging' || !state.pegging) return state
      if (state.pegging.turnPlayerId !== action.playerId) return state
      const player = getPlayer(state, action.playerId)
      const inHand = player.peggingHand.some((c) => c.id === action.card.id)
      if (!inHand) return state
      const legal = legalPeggingCards(player.peggingHand, state.pegging.count)
      if (!legal.some((c) => c.id === action.card.id)) return state

      let next = applyPegPlay(state, action.playerId, action.card)
      if (next.phase === 'show' && next.showStages.length === 0) next = resolveShow(next)
      return next
    }

    case 'SAY_GO': {
      if (state.phase !== 'pegging' || !state.pegging) return state
      if (state.pegging.turnPlayerId !== action.playerId) return state
      const player = getPlayer(state, action.playerId)
      const legal = legalPeggingCards(player.peggingHand, state.pegging.count)
      if (legal.length > 0) return state // must play if able

      let next = applyGo(state, action.playerId)
      if (next.phase === 'show' && next.showStages.length === 0) next = resolveShow(next)
      return next
    }

    case 'START_NEXT_HAND': {
      if (state.phase !== 'show' && state.phase !== 'gameOver') return state
      return dealNextHand(state, action.rng)
    }

    default:
      return state
  }
}
