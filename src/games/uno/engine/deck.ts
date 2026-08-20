import type { Card, Color, NumberValue, RNG } from './types'

const COLORS: Color[] = ['red', 'yellow', 'green', 'blue']
const NUMBERS: NumberValue[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

let idCounter = 0
function nextId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

/** Resets the internal id counter — call between games/tests that need deterministic ids. */
export function resetCardIds() {
  idCounter = 0
}

/** Builds the standard 108-card Uno deck, unshuffled. */
export function buildDeck(): Card[] {
  const cards: Card[] = []

  for (const color of COLORS) {
    cards.push({ id: nextId(`${color}-0`), color, value: '0' })
    for (const n of NUMBERS) {
      cards.push({ id: nextId(`${color}-${n}`), color, value: n })
      cards.push({ id: nextId(`${color}-${n}`), color, value: n })
    }
    for (const value of ['skip', 'reverse', 'draw2'] as const) {
      cards.push({ id: nextId(`${color}-${value}`), color, value })
      cards.push({ id: nextId(`${color}-${value}`), color, value })
    }
  }

  for (let i = 0; i < 4; i++) {
    cards.push({ id: nextId('wild'), color: null, value: 'wild' })
  }
  for (let i = 0; i < 4; i++) {
    cards.push({ id: nextId('wild-draw4'), color: null, value: 'wild-draw4' })
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
