import { RANKS, SUITS, type Card, type RNG } from './types'

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `card-${idCounter}`
}

/** Resets the internal id counter — call between games/tests that need deterministic ids. */
export function resetCardIds() {
  idCounter = 0
}

/** Builds the standard 52-card deck, unshuffled. */
export function buildDeck(): Card[] {
  const cards: Card[] = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({ id: nextId(), suit, rank })
    }
  }
  return cards
}

/** Fisher-Yates shuffle with an injectable RNG so tests can be deterministic. */
export function shuffle<T>(items: T[], rng: RNG = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
