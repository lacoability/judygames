export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

export const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']

/** In rank order — index+1 is also each rank's position for run detection. */
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const
export type Rank = (typeof RANKS)[number]

export interface Card {
  id: string
  suit: Suit
  rank: Rank
}

export type Phase = 'discard' | 'pegging' | 'show' | 'gameOver'

export interface Player {
  id: string
  name: string
  isBot: boolean
  /** 6 cards during `discard`; becomes the fixed kept 4 once discard resolves, used for show scoring. */
  hand: Card[]
  /** Cards left to play during `pegging` — starts equal to the kept 4, shrinks as cards are played. */
  peggingHand: Card[]
}

export interface PeggingEntry {
  card: Card
  playerId: string
}

export interface PeggingState {
  /** Cards played since the count last reset to 0 (the current "street"). */
  sequence: PeggingEntry[]
  count: number
  turnPlayerId: string
  /** Players who currently have no legal play and are waiting on the other to keep going. */
  stuck: string[]
}

export type ShowStageName = 'nonDealer' | 'dealer' | 'crib'

export interface ScoreLine {
  label: string
  points: number
}

export interface ScoreResult {
  total: number
  breakdown: ScoreLine[]
}

export interface ShowStage {
  name: ShowStageName
  /** Who these points are scored for (the crib always belongs to the dealer). */
  playerId: string
  cards: Card[]
  starter: Card
  result: ScoreResult
}

export type GameEvent =
  | { type: 'discarded'; playerId: string }
  | { type: 'starterCut'; card: Card }
  | { type: 'hisHeels'; playerId: string }
  | { type: 'pegged'; playerId: string; card: Card; points: number; reasons: string[] }
  | { type: 'go'; playerId: string }
  | { type: 'goPoint'; playerId: string; points: number }
  | { type: 'showScored'; stage: ShowStageName; playerId: string; points: number }
  | { type: 'won'; playerId: string }

export interface GameState {
  players: [Player, Player]
  dealerId: string
  phase: Phase
  /** Remaining stock after the 6/6 deal — the starter is cut from here. */
  deck: Card[]
  crib: Card[]
  /** Discards staged during `discard`, keyed by player id — resolved once both are in. */
  pendingDiscards: Partial<Record<string, [Card, Card]>>
  starter: Card | null
  pegging: PeggingState | null
  showStages: ShowStage[]
  scores: Record<string, number>
  status: 'in-progress' | 'won'
  winnerId: string | null
  log: GameEvent[]
  handNumber: number
}

export type RNG = () => number
