import type { Card, Color, GameState, Player, VariantConfig } from './types'
import { DEFAULT_VARIANTS } from './types'

let testIdCounter = 0
export function card(color: Color | null, value: Card['value']): Card {
  testIdCounter += 1
  return { id: `test-${testIdCounter}`, color, value }
}

export function makePlayer(id: string, hand: Card[], overrides: Partial<Player> = {}): Player {
  return { id, name: id, isBot: false, hand, calledUno: false, ...overrides }
}

export function makeState(overrides: Partial<GameState> & { players: Player[] }): GameState {
  const topCard = overrides.discardPile?.[overrides.discardPile.length - 1] ?? card('red', '5')
  return {
    drawPile: [],
    discardPile: [topCard],
    currentPlayerIndex: 0,
    direction: 1,
    activeColor: topCard.color ?? 'red',
    pendingDrawCount: 0,
    pendingDrawType: null,
    variants: { ...DEFAULT_VARIANTS },
    status: 'in-progress',
    winnerId: null,
    log: [],
    ...overrides,
  }
}

export function withVariants(variants: Partial<VariantConfig>): VariantConfig {
  return { ...DEFAULT_VARIANTS, ...variants }
}
