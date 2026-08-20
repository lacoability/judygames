export type Color = 'red' | 'yellow' | 'green' | 'blue'

export type NumberValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
export type ActionValue = 'skip' | 'reverse' | 'draw2'
export type WildValue = 'wild' | 'wild-draw4'
export type Value = NumberValue | ActionValue | WildValue

export interface Card {
  id: string
  /** Wild cards have color `null` until played and resolved to a chosen color. */
  color: Color | null
  value: Value
}

export interface Player {
  id: string
  name: string
  isBot: boolean
  hand: Card[]
  calledUno: boolean
}

export type StackingMode = 'off' | 'draw2-only' | 'draw2-and-draw4-cross-stack'

export interface VariantConfig {
  stacking: StackingMode
  jumpIn: boolean
  sevenZero: boolean
}

export const DEFAULT_VARIANTS: VariantConfig = {
  stacking: 'off',
  jumpIn: false,
  sevenZero: false,
}

export type GameEvent =
  | { type: 'played'; playerId: string; card: Card }
  | { type: 'drew'; playerId: string; count: number }
  | { type: 'jumpedIn'; playerId: string; card: Card }
  | { type: 'calledUno'; playerId: string }
  | { type: 'unoPenalty'; playerId: string; count: number }
  | { type: 'skipped'; playerId: string }
  | { type: 'reversed' }
  | { type: 'swapped'; playerId: string; withPlayerId: string }
  | { type: 'rotated' }
  | { type: 'colorChosen'; playerId: string; color: Color }
  | { type: 'won'; playerId: string }

export interface GameState {
  players: Player[]
  drawPile: Card[]
  discardPile: Card[]
  currentPlayerIndex: number
  direction: 1 | -1
  /** Resolved color in play — a wild card's own `color` is null, this is what it resolved to. */
  activeColor: Color
  pendingDrawCount: number
  pendingDrawType: 'draw2' | 'draw4' | null
  variants: VariantConfig
  status: 'in-progress' | 'won'
  winnerId: string | null
  log: GameEvent[]
}

export type RNG = () => number
