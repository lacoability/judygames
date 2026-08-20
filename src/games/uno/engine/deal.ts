import type { Card, GameState, Player, RNG, VariantConfig } from './types'
import { buildDeck, shuffle } from './deck'

export function dealHands(
  deck: Card[],
  playerCount: number,
  handSize = 7,
): { hands: Card[][]; remainingDeck: Card[] } {
  const hands: Card[][] = Array.from({ length: playerCount }, () => [])
  let cursor = 0
  for (let round = 0; round < handSize; round++) {
    for (let p = 0; p < playerCount; p++) {
      hands[p].push(deck[cursor])
      cursor += 1
    }
  }
  return { hands, remainingDeck: deck.slice(cursor) }
}

export interface NewPlayerConfig {
  id: string
  name: string
  isBot: boolean
}

export function initGame(players: NewPlayerConfig[], variants: VariantConfig, rng: RNG = Math.random): GameState {
  let deck = shuffle(buildDeck(), rng)
  const { hands, remainingDeck } = dealHands(deck, players.length)
  deck = remainingDeck

  const fullPlayers: Player[] = players.map((p, i) => ({
    ...p,
    hand: hands[i],
    calledUno: false,
  }))

  // Draw the starting discard card. A Wild Draw Four can't legally open the
  // game, so if one comes up it goes back into the deck and we reshuffle.
  let discardPile: Card[] = []
  while (true) {
    const [top, ...rest] = deck
    if (top.value !== 'wild-draw4') {
      discardPile = [top]
      deck = rest
      break
    }
    deck = shuffle([...rest, top], rng)
  }

  const topCard = discardPile[0]
  // Wild cards opening the game resolve to a random color; anything else is
  // simply that card's color. Any opening action card's effect is NOT
  // applied to the first player — this keeps game setup simple and matches
  // how most digital Uno clones handle the opening card.
  const activeColor = topCard.color ?? (['red', 'yellow', 'green', 'blue'] as const)[Math.floor(rng() * 4)]

  return {
    players: fullPlayers,
    drawPile: deck,
    discardPile,
    currentPlayerIndex: 0,
    direction: 1,
    activeColor,
    pendingDrawCount: 0,
    pendingDrawType: null,
    variants,
    status: 'in-progress',
    winnerId: null,
    log: [],
  }
}
