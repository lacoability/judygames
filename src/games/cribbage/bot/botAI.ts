import { RANKS, SUITS, type Card } from '../engine/types'
import { cardValue, rankOrder, scoreHand, scorePeggingPlay } from '../engine/scoring'

function combinations2(items: Card[]): [Card, Card][] {
  const pairs: [Card, Card][] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) pairs.push([items[i], items[j]])
  }
  return pairs
}

/** The 46 cards not already in the given hand — every possible starter cut. */
function unseenCards(known: Card[]): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (!known.some((k) => k.rank === rank && k.suit === suit)) cards.push({ id: `${suit}-${rank}`, suit, rank })
    }
  }
  return cards
}

/**
 * Cheap pattern checks on a discarded pair that tend to help (or hurt) the
 * crib, without the cost of fully simulating it against every possible
 * partner pair and starter.
 */
function cribAffinity(pair: [Card, Card]): number {
  const [x, y] = pair
  let bonus = 0
  if (x.rank === '5' || y.rank === '5') bonus += 0.5 // a 5 pairs with any ten-card for a crib fifteen
  if (x.rank === y.rank) bonus += 0.6 // sent together, this is already a made pair
  if (cardValue(x.rank) + cardValue(y.rank) === 15) bonus += 0.4
  if (Math.abs(rankOrder(x.rank) - rankOrder(y.rank)) === 1) bonus += 0.3 // adjacent ranks can seed a run
  return bonus
}

/**
 * Tries all 15 possible 2-card discards, scoring each by the kept hand's
 * average value across every possible starter, adjusted by a lightweight
 * crib-affinity heuristic (positive if the bot is dealer and so owns the
 * crib, negative otherwise). No lookahead into how the pegging phase plays
 * out — that's `choosePeggingPlay`'s job.
 */
export function chooseDiscard(hand6: Card[], isBotDealer: boolean): [Card, Card] {
  const unseen = unseenCards(hand6)
  let best = combinations2(hand6)[0]
  let bestValue = -Infinity

  for (const discardPair of combinations2(hand6)) {
    const kept = hand6.filter((c) => c !== discardPair[0] && c !== discardPair[1])
    const avgHandValue = unseen.reduce((sum, starter) => sum + scoreHand(kept, starter).total, 0) / unseen.length
    const value = avgHandValue + cribAffinity(discardPair) * (isBotDealer ? 1 : -1)
    if (value > bestValue) {
      bestValue = value
      best = discardPair
    }
  }

  return best
}

export type PeggingDecision = { type: 'play'; card: Card } | { type: 'go' }

/**
 * Single heuristic tier, stateless per decision — no lookahead/minimax,
 * matching the other bot in this app. Prefers a card that scores
 * immediately, then avoids leaving the count at 5 or 21 (an easy 15/31 for
 * an opponent holding a ten-card), then sheds its lowest card to conserve
 * stronger ones for later.
 */
export function choosePeggingPlay(playableCards: Card[], count: number, sequenceSoFar: Card[]): PeggingDecision {
  if (playableCards.length === 0) return { type: 'go' }

  let best = playableCards[0]
  let bestValue = -Infinity
  for (const card of playableCards) {
    const newCount = count + cardValue(card.rank)
    // scorePeggingPlay deliberately leaves the 31 bonus to its caller, so it
    // has to be added back here or the bot never sees the 2 for hitting 31.
    const { points } = scorePeggingPlay([...sequenceSoFar, card], newCount)
    const thirtyOne = newCount === 31 ? 2 : 0
    const danger = newCount === 5 || newCount === 21 ? -3 : 0
    const value = (points + thirtyOne) * 10 + danger - cardValue(card.rank) * 0.01
    if (value > bestValue) {
      bestValue = value
      best = card
    }
  }
  return { type: 'play', card: best }
}
