import { RANKS, type Card, type Rank, type ScoreLine, type ScoreResult } from './types'

export const WINNING_SCORE = 121

export function hasWon(score: number): boolean {
  return score >= WINNING_SCORE
}

/** Ace low, 10/J/Q/K all worth 10 — cribbage's point value, distinct from run order. */
export function cardValue(rank: Rank): number {
  if (rank === 'A') return 1
  if (rank === 'J' || rank === 'Q' || rank === 'K' || rank === '10') return 10
  return Number(rank)
}

/** 1-13, ace low — used for run detection (adjacent order, not point value). */
export function rankOrder(rank: Rank): number {
  return RANKS.indexOf(rank) + 1
}

function scoreFifteens(cards: Card[]): ScoreLine[] {
  const lines: ScoreLine[] = []
  const n = cards.length
  for (let mask = 1; mask < 1 << n; mask++) {
    let sum = 0
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sum += cardValue(cards[i].rank)
    }
    if (sum === 15) lines.push({ label: 'Fifteen', points: 2 })
  }
  return lines
}

function scorePairs(cards: Card[]): ScoreLine[] {
  const lines: ScoreLine[] = []
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      if (cards[i].rank === cards[j].rank) lines.push({ label: 'Pair', points: 2 })
    }
  }
  return lines
}

/**
 * Maximal runs of 3+ consecutive distinct ranks. A run's points are its
 * length times the product of each rank's multiplicity in it — this is what
 * correctly produces a "double run" (e.g. 3-3-4-5 = a run of 3 twice, for 6)
 * without double-counting the pair, which `scorePairs` already accounts for
 * separately.
 */
function scoreRuns(cards: Card[]): ScoreLine[] {
  const counts = new Map<number, number>()
  for (const c of cards) {
    const v = rankOrder(c.rank)
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  const distinct = [...counts.keys()].sort((a, b) => a - b)

  const lines: ScoreLine[] = []
  let streak: number[] = []
  const flushStreak = () => {
    if (streak.length >= 3) {
      const product = streak.reduce((p, v) => p * (counts.get(v) ?? 1), 1)
      lines.push({ label: `Run of ${streak.length}`, points: streak.length * product })
    }
    streak = []
  }
  for (let i = 0; i < distinct.length; i++) {
    if (i > 0 && distinct[i] !== distinct[i - 1] + 1) flushStreak()
    streak.push(distinct[i])
  }
  flushStreak()
  return lines
}

function scoreFlush(fourCards: Card[], starter: Card, isCrib: boolean): ScoreLine[] {
  const suit = fourCards[0]?.suit
  if (!suit || !fourCards.every((c) => c.suit === suit)) return []
  if (starter.suit === suit) return [{ label: 'Flush', points: 5 }]
  // The crib requires all 5 cards to match — no partial-flush consolation.
  return isCrib ? [] : [{ label: 'Flush', points: 4 }]
}

function scoreNobs(fourCards: Card[], starter: Card): ScoreLine[] {
  const hasNobs = fourCards.some((c) => c.rank === 'J' && c.suit === starter.suit)
  return hasNobs ? [{ label: 'His Nobs', points: 1 }] : []
}

/** Scores a 4-card hand (or crib) against the starter. */
export function scoreHand(fourCards: Card[], starter: Card, isCrib = false): ScoreResult {
  const all5 = [...fourCards, starter]
  const breakdown: ScoreLine[] = [
    ...scoreFifteens(all5),
    ...scorePairs(all5),
    ...scoreRuns(all5),
    ...scoreFlush(fourCards, starter, isCrib),
    ...scoreNobs(fourCards, starter),
  ]
  const total = breakdown.reduce((sum, l) => sum + l.points, 0)
  return { total, breakdown }
}

/**
 * Scores the card just played during pegging, given the full sequence since
 * the count last reset (including the new card) and the resulting count.
 * A single play can legitimately score more than one of these at once.
 * Hitting exactly 31 is scored separately by the caller (as a "go"-shaped
 * event, since it replaces rather than adds to the last-card go point).
 */
export function scorePeggingPlay(sequence: Card[], count: number): { points: number; reasons: string[] } {
  const reasons: string[] = []
  let points = 0

  if (count === 15) {
    points += 2
    reasons.push('Fifteen for 2')
  }

  const last = sequence[sequence.length - 1]
  let matchRun = 1
  for (let i = sequence.length - 2; i >= 0 && sequence[i].rank === last.rank; i--) matchRun++
  if (matchRun === 2) {
    points += 2
    reasons.push('Pair for 2')
  } else if (matchRun === 3) {
    points += 6
    reasons.push('Pair royal for 6')
  } else if (matchRun >= 4) {
    points += 12
    reasons.push('Double pair royal for 12')
  }

  let bestRun = 0
  for (let len = 3; len <= sequence.length; len++) {
    const window = sequence.slice(sequence.length - len)
    const values = window.map((c) => rankOrder(c.rank))
    const unique = new Set(values)
    if (unique.size !== len) continue // a repeated rank in the window can't form a straight run
    const sorted = [...unique].sort((a, b) => a - b)
    if (sorted[sorted.length - 1] - sorted[0] === len - 1) bestRun = len
  }
  if (bestRun >= 3) {
    points += bestRun
    reasons.push(`Run of ${bestRun} for ${bestRun}`)
  }

  return { points, reasons }
}
