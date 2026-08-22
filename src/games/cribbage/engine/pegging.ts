import type { Card, GameState, Player } from './types'
import { cardValue, hasWon, scorePeggingPlay } from './scoring'

export function legalPeggingCards(hand: Card[], count: number): Card[] {
  return hand.filter((c) => count + cardValue(c.rank) <= 31)
}

export function otherPlayerId(state: GameState, playerId: string): string {
  const [a, b] = state.players
  return a.id === playerId ? b.id : a.id
}

export function getPlayer(state: GameState, playerId: string): Player {
  return state.players.find((p) => p.id === playerId)!
}

/** Marks the game won if this score crossed 121, mutating the (already-cloned) draft state. */
function applyWinCheck(state: GameState, playerId: string): boolean {
  if (!hasWon(state.scores[playerId])) return false
  state.status = 'won'
  state.winnerId = playerId
  state.phase = 'gameOver'
  state.log.push({ type: 'won', playerId })
  return true
}

function bothHandsEmpty(state: GameState): boolean {
  return state.players.every((p) => p.peggingHand.length === 0)
}

/**
 * Applies a legal pegging play. Scores the play itself (15/31/pair/run),
 * then resolves what happens next: hitting exactly 31 or emptying both
 * hands ends the current "street" (or the whole pegging phase); otherwise
 * the turn simply alternates. `phase` is set to `'show'` (with `pegging`
 * cleared) as a signal for the reducer to run `resolveShow` — this module
 * doesn't score hands itself, only pegging plays.
 */
export function applyPegPlay(state: GameState, playerId: string, card: Card): GameState {
  const next: GameState = structuredClone(state)
  const player = getPlayer(next, playerId)
  const other = getPlayer(next, otherPlayerId(next, playerId))
  const pegging = next.pegging!

  player.peggingHand = player.peggingHand.filter((c) => c.id !== card.id)
  pegging.sequence.push({ card, playerId })
  pegging.count += cardValue(card.rank)

  const { points, reasons } = scorePeggingPlay(
    pegging.sequence.map((e) => e.card),
    pegging.count,
  )
  if (points > 0) {
    next.scores[playerId] += points
    next.log.push({ type: 'pegged', playerId, card, points, reasons })
    if (applyWinCheck(next, playerId)) return next
  }

  const hitThirtyOne = pegging.count === 31
  if (hitThirtyOne) {
    next.scores[playerId] += 2
    next.log.push({ type: 'goPoint', playerId, points: 2 })
    if (applyWinCheck(next, playerId)) return next
  }

  if (bothHandsEmpty(next)) {
    // Hitting exactly 31 already scored its own 2 — otherwise this last card
    // gets the standard "1 for last" the same way an unresolved go would.
    if (!hitThirtyOne) {
      next.scores[playerId] += 1
      next.log.push({ type: 'goPoint', playerId, points: 1 })
      if (applyWinCheck(next, playerId)) return next
    }
    next.phase = 'show'
    next.pegging = null
    return next
  }

  if (hitThirtyOne) {
    pegging.sequence = []
    pegging.count = 0
    pegging.stuck = []
    pegging.turnPlayerId = otherPlayerId(next, playerId)
    return next
  }

  // The turn only passes to the opponent if they can actually answer. Once
  // they're stuck they stay on their "go" and this player keeps laying cards,
  // rather than being handed the turn back to declare go after every card.
  if (legalPeggingCards(other.peggingHand, pegging.count).length > 0) {
    pegging.turnPlayerId = other.id
    return next
  }

  if (!pegging.stuck.includes(other.id)) {
    pegging.stuck.push(other.id)
    next.log.push({ type: 'go', playerId: other.id })
  }

  if (legalPeggingCards(player.peggingHand, pegging.count).length > 0) {
    pegging.turnPlayerId = playerId
    return next
  }

  // Neither can play on: this player laid the last card, so takes the go point
  // and the opponent leads the next street.
  next.scores[playerId] += 1
  next.log.push({ type: 'goPoint', playerId, points: 1 })
  if (applyWinCheck(next, playerId)) return next
  next.pegging = { sequence: [], count: 0, stuck: [], turnPlayerId: other.id }

  return next
}

/**
 * Applies a "go": the current player has no legal card. If the other player
 * can still respond, play passes to them (they keep going, un-alternating,
 * until they too are stuck). Once neither can act, the street resolves —
 * the last player to actually play a card pegs 1 for "go", the count
 * resets, and the player who was stuck leads the next street. An empty
 * hand is always "no legal card," so this same path naturally produces the
 * standard "1 for last card" once both hands are fully empty.
 */
export function applyGo(state: GameState, playerId: string): GameState {
  const next: GameState = structuredClone(state)
  const pegging = next.pegging!
  const otherId = otherPlayerId(next, playerId)

  if (!pegging.stuck.includes(playerId)) pegging.stuck.push(playerId)
  next.log.push({ type: 'go', playerId })

  if (!pegging.stuck.includes(otherId)) {
    const other = getPlayer(next, otherId)
    const otherLegal = legalPeggingCards(other.peggingHand, pegging.count)
    if (otherLegal.length > 0) {
      pegging.turnPlayerId = otherId
      return next
    }
    pegging.stuck.push(otherId)
  }

  // Both players are stuck — resolve the street.
  const last = pegging.sequence.at(-1)
  if (!last) return next // safety net; shouldn't be reachable

  next.scores[last.playerId] += 1
  next.log.push({ type: 'goPoint', playerId: last.playerId, points: 1 })
  if (applyWinCheck(next, last.playerId)) return next

  if (bothHandsEmpty(next)) {
    next.phase = 'show'
    next.pegging = null
    return next
  }

  next.pegging = {
    sequence: [],
    count: 0,
    stuck: [],
    turnPlayerId: otherPlayerId(next, last.playerId),
  }
  return next
}
