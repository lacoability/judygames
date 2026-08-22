import { useMemo, useRef } from 'react'
import { WINNING_SCORE } from '../engine/scoring'
import styles from './PegBoard.module.css'

export type PegMetal = 'steel' | 'brass'

interface PegBoardPlayer {
  id: string
  name: string
  score: number
  metal: PegMetal
}

interface PegBoardProps {
  players: [PegBoardPlayer, PegBoardPlayer]
}

const SVG_W = 560
const SVG_H = 124
const PAD_L = 16
const PAD_R = 16
const HOLES = 60
const GROUP = 5
const HOLE_R = 2.2
const PEG_R = 4.2
const FINISH_R = 3.4
const FINISH_GAP = 16

/**
 * Holes are drilled in groups of five, the way a real board is — the small
 * gap every fifth hole is what makes a peg's position countable at a glance.
 * The track therefore spans 59 hole-steps plus 11 half-step group gaps.
 */
const TRACK_W = SVG_W - PAD_L - PAD_R - FINISH_GAP - FINISH_R * 2
const GROUP_GAPS = HOLES / GROUP - 1
const STEP = TRACK_W / (HOLES - 1 + GROUP_GAPS * 0.5)
const GROUP_GAP = STEP * 0.5
const FINISH_X = PAD_L + TRACK_W + FINISH_GAP + FINISH_R

/** Each player gets two lanes: 1-60 along the top, 61-120 along the bottom. */
const LANES: Record<'a' | 'b', [number, number]> = {
  a: [26, 42],
  b: [82, 98],
}
const INLAY_TOP = 52
const INLAY_H = 20
const INLAY_TEXT_Y = 67
/** Width reserved for a player's name, so both scores start at the same offset. */
const NAME_COL_W = 48
/** The score a loser must reach to avoid a skunk — marked on real boards too. */
const SKUNK_SCORE = 91

function holeX(col: number): number {
  return PAD_L + col * STEP + Math.floor(col / GROUP) * GROUP_GAP
}

function pegPosition(score: number, lanes: [number, number]): { x: number; y: number } | null {
  if (score <= 0) return null
  if (score >= WINNING_SCORE) return { x: FINISH_X, y: lanes[1] }
  if (score <= HOLES) return { x: holeX(score - 1), y: lanes[0] }
  return { x: holeX(score - HOLES - 1), y: lanes[1] }
}

function Lane({ y }: { y: number }) {
  return (
    <>
      {Array.from({ length: HOLES }, (_, i) => (
        <circle key={i} cx={holeX(i)} cy={y} r={HOLE_R} fill="url(#cb-bore)" />
      ))}
    </>
  )
}

/** A brass-ringed 121 hole at the end of each player's second lane. */
function FinishHole({ y }: { y: number }) {
  return (
    <>
      <circle cx={FINISH_X} cy={y} r={FINISH_R + 1.6} fill="url(#cb-brass)" opacity="0.85" />
      <circle cx={FINISH_X} cy={y} r={FINISH_R} fill="url(#cb-bore)" />
    </>
  )
}

function Peg({ x, y, metal, back }: { x: number; y: number; metal: PegMetal; back?: boolean }) {
  const r = back ? PEG_R * 0.72 : PEG_R
  return (
    <g className={back ? styles.backPeg : styles.frontPeg} style={{ transform: `translate(${x}px, ${y}px)` }}>
      {/* Contact shadow pooled on the wood, offset from the light up-left. */}
      <ellipse cx={r * 0.3} cy={r * 0.42} rx={r * 1.12} ry={r * 0.66} fill="#120a03" opacity="0.42" />
      <circle r={r} fill={`url(#cb-${metal})`} stroke="#231a10" strokeWidth="0.35" opacity="0.98" />
      {/* Specular glint — what actually sells it as polished metal rather than a dot. */}
      <ellipse cx={-r * 0.3} cy={-r * 0.34} rx={r * 0.34} ry={r * 0.22} fill="#fff" opacity="0.8" transform="rotate(-28)" />
    </g>
  )
}

/**
 * Brass lettering inlaid into the wood: a dark shadow dropped just below the
 * glyph, then the bright metal face over it. Engraving it dark-on-dark would
 * be more literal but unreadable against a walnut board.
 */
function Inlaid({
  x,
  y,
  anchor,
  variant = 'label',
  children,
}: {
  x: number
  y: number
  anchor: 'start' | 'end'
  variant?: 'label' | 'value'
  children: string
}) {
  const face = variant === 'value' ? styles.inlayValue : styles.inlayLabel
  return (
    <>
      <text x={x} y={y + 1} textAnchor={anchor} className={`${face} ${styles.inlayShadow}`}>
        {children}
      </text>
      <text x={x} y={y} textAnchor={anchor} className={face}>
        {children}
      </text>
    </>
  )
}

export function PegBoard({ players }: PegBoardProps) {
  // Tracks the last *different* score per player so the trailing peg keeps
  // marking where the front peg jumped from, instead of snapping shut on the
  // next unrelated re-render. Idempotent, so StrictMode's double render is fine.
  const lastScores = useRef<Record<string, number>>({})
  const prevScores = useRef<Record<string, number>>({})
  for (const p of players) {
    if (lastScores.current[p.id] === undefined) {
      lastScores.current[p.id] = p.score
      prevScores.current[p.id] = p.score
    } else if (lastScores.current[p.id] !== p.score) {
      prevScores.current[p.id] = lastScores.current[p.id]
      lastScores.current[p.id] = p.score
    }
  }

  // The drilled board never changes — only the pegs move.
  const board = useMemo(
    () => (
      <>
        <rect x="3" y="3" width={SVG_W - 6} height={SVG_H - 6} rx="12" fill="url(#cb-wood)" />
        <rect
          x="3"
          y="3"
          width={SVG_W - 6}
          height={SVG_H - 6}
          rx="12"
          fill="#3c2109"
          filter="url(#cb-grain)"
          style={{ mixBlendMode: 'multiply' }}
        />
        {/* Bevel: light catching the top edge, shadow gathering along the bottom. */}
        <rect x="3" y="3" width={SVG_W - 6} height={SVG_H - 6} rx="12" fill="none" stroke="url(#cb-bevel)" strokeWidth="2.5" />
        <rect x="6.5" y="6.5" width={SVG_W - 13} height={SVG_H - 13} rx="9" fill="none" stroke="#2b1708" strokeWidth="0.8" opacity="0.55" />

        {/* Routed inlay strip between the two players' tracks. */}
        <rect x={PAD_L - 6} y={INLAY_TOP} width={SVG_W - PAD_L - PAD_R + 12} height={INLAY_H} rx="5" fill="#3a2009" opacity="0.42" />

        <Lane y={LANES.a[0]} />
        <Lane y={LANES.a[1]} />
        <Lane y={LANES.b[0]} />
        <Lane y={LANES.b[1]} />
        <FinishHole y={LANES.a[1]} />
        <FinishHole y={LANES.b[1]} />

        {/* Skunk line at 91 — the mark a trailing player is racing to clear. */}
        {(['a', 'b'] as const).map((key) => (
          <line
            key={key}
            x1={holeX(SKUNK_SCORE - HOLES - 1)}
            y1={LANES[key][1] - 7}
            x2={holeX(SKUNK_SCORE - HOLES - 1)}
            y2={LANES[key][1] + 7}
            stroke="#2b1708"
            strokeWidth="0.8"
            opacity="0.5"
          />
        ))}

        {/* Brass screws sunk at the corners. */}
        {[
          [13, 13],
          [SVG_W - 13, 13],
          [13, SVG_H - 13],
          [SVG_W - 13, SVG_H - 13],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="3.1" fill="url(#cb-brass)" stroke="#4a3208" strokeWidth="0.4" />
            <line x1={cx - 1.7} y1={cy} x2={cx + 1.7} y2={cy} stroke="#4a3208" strokeWidth="0.7" opacity="0.8" />
          </g>
        ))}

        <Inlaid x={SVG_W - PAD_R} y={INLAY_TEXT_Y} anchor="end">
          {String(WINNING_SCORE)}
        </Inlaid>
      </>
    ),
    [],
  )

  const [a, b] = players

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className={styles.svg}
        role="img"
        aria-label={`Cribbage board. ${a.name} ${a.score}, ${b.name} ${b.score}. First to ${WINNING_SCORE} wins.`}
      >
        <defs>
          <linearGradient id="cb-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8b552a" />
            <stop offset="0.35" stopColor="#71421f" />
            <stop offset="0.72" stopColor="#5e3618" />
            <stop offset="1" stopColor="#6b3f1e" />
          </linearGradient>
          <linearGradient id="cb-bevel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c08a52" stopOpacity="0.85" />
            <stop offset="0.45" stopColor="#7a4a21" stopOpacity="0" />
            <stop offset="1" stopColor="#1d0e04" stopOpacity="0.9" />
          </linearGradient>
          {/* Low frequency across, high frequency down — reads as horizontal grain. */}
          <filter id="cb-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.014 0.85" numOctaves="4" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" result="mono" />
            <feComponentTransfer in="mono" result="soft">
              <feFuncA type="linear" slope="0.42" intercept="0" />
            </feComponentTransfer>
            <feComposite in="soft" in2="SourceGraphic" operator="in" />
          </filter>
          {/* Drilled bore: dark at the mouth, with light bouncing off the far wall. */}
          <radialGradient id="cb-bore" cx="50%" cy="74%" r="72%">
            <stop offset="0" stopColor="#8a5a30" stopOpacity="0.6" />
            <stop offset="0.5" stopColor="#2a1608" />
            <stop offset="1" stopColor="#150a02" />
          </radialGradient>
          <radialGradient id="cb-steel" cx="34%" cy="28%" r="78%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.32" stopColor="#dce2e9" />
            <stop offset="0.72" stopColor="#8d98a6" />
            <stop offset="1" stopColor="#454d57" />
          </radialGradient>
          <radialGradient id="cb-brass" cx="34%" cy="28%" r="78%">
            <stop offset="0" stopColor="#fff8dc" />
            <stop offset="0.32" stopColor="#f2d68d" />
            <stop offset="0.72" stopColor="#bf9038" />
            <stop offset="1" stopColor="#6d4d12" />
          </radialGradient>
        </defs>

        {board}

        {/* Name then score at a fixed offset, so the two players' numbers line up
            in the same two columns regardless of name length. */}
        <Inlaid x={PAD_L + 2} y={INLAY_TEXT_Y} anchor="start">
          {a.name}
        </Inlaid>
        <Inlaid x={PAD_L + 2 + NAME_COL_W} y={INLAY_TEXT_Y} anchor="start" variant="value">
          {String(a.score)}
        </Inlaid>
        <Inlaid x={SVG_W * 0.46} y={INLAY_TEXT_Y} anchor="start">
          {b.name}
        </Inlaid>
        <Inlaid x={SVG_W * 0.46 + NAME_COL_W} y={INLAY_TEXT_Y} anchor="start" variant="value">
          {String(b.score)}
        </Inlaid>

        {/* Back peg first so the front peg overlaps it when they land close together. */}
        {([
          [a, LANES.a],
          [b, LANES.b],
        ] as const).flatMap(([player, lanes]) => {
          const back = pegPosition(prevScores.current[player.id] ?? 0, lanes)
          const front = pegPosition(player.score, lanes)
          return [
            back && player.score !== prevScores.current[player.id] ? (
              <Peg key={`${player.id}-back`} {...back} metal={player.metal} back />
            ) : null,
            front ? <Peg key={`${player.id}-front`} {...front} metal={player.metal} /> : null,
          ]
        })}
      </svg>
    </div>
  )
}
