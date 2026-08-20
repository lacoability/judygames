import type { Card, Color, GameState } from '../engine/types'
import { getPlayableCards, canStack } from '../engine/rules'
import { nextPlayerIndex } from '../engine/turn'

export type BotDecision =
  | { type: 'play'; card: Card; chosenColor?: Color; swapTargetId?: string }
  | { type: 'draw' }

const COLORS: Color[] = ['red', 'yellow', 'green', 'blue']

/** Majority color remaining in hand keeps the most future cards playable. */
export function decideWildColor(hand: Card[]): Color {
  const counts: Record<Color, number> = { red: 0, yellow: 0, green: 0, blue: 0 }
  for (const c of hand) {
    if (c.color) counts[c.color] += 1
  }
  return COLORS.reduce((best, color) => (counts[color] > counts[best] ? color : best), COLORS[0])
}

/**
 * For the 7-rule hand swap: the smallest hand among opponents is always the
 * best available outcome for the bot, whether that's stealing an
 * opponent's lead or minimizing the damage of a forced swap when the bot
 * already has the fewest cards itself.
 */
export function decideSwapTarget(state: GameState, botId: string): string {
  const opponents = state.players.filter((p) => p.id !== botId)
  return opponents.reduce((best, p) => (p.hand.length < best.hand.length ? p : best), opponents[0]).id
}

function cardPriority(card: Card, threatened: boolean): number {
  if (card.value === 'wild-draw4') return threatened ? 100 : 40
  if (card.value === 'draw2') return threatened ? 90 : 35
  if (card.value === 'skip') return threatened ? 80 : 30
  if (card.value === 'reverse') return threatened ? 70 : 25
  if (card.value === 'wild') return 10 // kept as a flexible out unless it's the only option
  return 50 + Number(card.value) // number cards: shed the highest first
}

/**
 * Single heuristic tier, stateless per decision — no lookahead/minimax.
 * "Threatened" means the next player in turn order is close to winning
 * (few cards left), which bumps action cards above number cards.
 */
export function decideBotMove(state: GameState, botId: string): BotDecision {
  const player = state.players.find((p) => p.id === botId)!

  if (state.pendingDrawCount > 0) {
    const stackable = player.hand.filter((c) => canStack(c, state))
    if (stackable.length === 0) return { type: 'draw' }
    const card = stackable[0]
    const chosenColor = card.value === 'wild-draw4' ? decideWildColor(player.hand) : undefined
    return { type: 'play', card, chosenColor }
  }

  const playable = getPlayableCards(player.hand, state)
  if (playable.length === 0) return { type: 'draw' }

  const nextPlayer = state.players[nextPlayerIndex(state)]
  const threatened = nextPlayer.hand.length <= 3

  const card = playable.reduce((best, c) =>
    cardPriority(c, threatened) > cardPriority(best, threatened) ? c : best,
  )

  const isWild = card.value === 'wild' || card.value === 'wild-draw4'
  const chosenColor = isWild ? decideWildColor(player.hand) : undefined
  const swapTargetId = card.value === '7' && state.variants.sevenZero ? decideSwapTarget(state, botId) : undefined

  return { type: 'play', card, chosenColor, swapTargetId }
}

/**
 * Jump-in is human-only for this MVP difficulty tier — bots never
 * proactively act outside their own turn. Kept as a stub with the same
 * shape as decideBotMove so a future difficulty tier can implement
 * reactive jump-in without changing the reducer/turn-loop contract.
 */
export function decideJumpIn(_state: GameState, _botId: string): BotDecision | null {
  return null
}
