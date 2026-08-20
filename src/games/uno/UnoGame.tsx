import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import type { Card, Color, GameState, VariantConfig } from './engine/types'
import { DEFAULT_VARIANTS } from './engine/types'
import { initGame } from './engine/deal'
import { gameReducer, type GameAction } from './engine/gameReducer'
import { getPlayableCards, isJumpInEligible } from './engine/rules'
import { checkUnoCallRequired } from './engine/uno-call'
import { decideBotMove } from './bot/botAI'
import { VariantSettingsPanel } from './components/VariantSettingsPanel'
import { PlayerHandFan } from './components/PlayerHandFan'
import { OpponentHandBadge } from './components/OpponentHandBadge'
import { DiscardPile } from './components/DiscardPile'
import { DrawPile } from './components/DrawPile'
import { ColorPickerModal } from './components/ColorPickerModal'
import { SwapTargetModal } from './components/SwapTargetModal'
import { TurnIndicator } from './components/TurnIndicator'
import { EventLog } from './components/EventLog'
import { WinModal } from './components/WinModal'
import { DrawCallout } from './components/DrawCallout'
import { FlyingCard, type Point } from './components/FlyingCard'
import styles from './UnoGame.module.css'

const HUMAN_ID = 'human'
// Bots pause an unpredictable beat before acting, so play feels dealt rather
// than metronomic.
const BOT_DELAY_MIN_MS = 500
const BOT_DELAY_MAX_MS = 1500

/** Felt palettes per colour: bright centre → mid → dark falloff → table edge. */
const FELT: Record<Color, { hi: string; mid: string; lo: string; edge: string }> = {
  red: { hi: '#9c4340', mid: '#6e2c2b', lo: '#451a1a', edge: '#220b0b' },
  yellow: { hi: '#9d8330', mid: '#6f5c21', lo: '#463a15', edge: '#221c09' },
  green: { hi: '#2f8f66', mid: '#1a6046', lo: '#0e3c2c', edge: '#071d16' },
  blue: { hi: '#33639e', mid: '#1f4470', lo: '#132b48', edge: '#08121f' },
}

interface Flight {
  id: number
  card: Card
  from: Point
  to: Point
}

function centreOf(el: Element): Point {
  const rect = el.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

function buildPlayers(botCount: number) {
  return [
    { id: HUMAN_ID, name: 'You', isBot: false },
    ...Array.from({ length: botCount }, (_, i) => ({ id: `bot${i + 1}`, name: `Bot ${i + 1}`, isBot: true })),
  ]
}

type PendingChoice = { kind: 'color'; card: Card; jumpIn: boolean } | { kind: 'swapTarget'; card: Card } | null

export function UnoGame() {
  const [screen, setScreen] = useState<'setup' | 'table'>('setup')
  const [variants, setVariants] = useState<VariantConfig>(DEFAULT_VARIANTS)
  const [botCount, setBotCount] = useState(3)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [pending, setPending] = useState<PendingChoice>(null)
  const [flight, setFlight] = useState<Flight | null>(null)

  const seatRefs = useRef(new Map<string, HTMLElement>())
  const handRef = useRef<HTMLDivElement>(null)
  const discardRef = useRef<HTMLDivElement>(null)
  const lastTopIdRef = useRef<string | null>(null)
  const flightSeq = useRef(0)

  function dispatch(action: GameAction) {
    setGameState((s) => (s ? gameReducer(s, action) : s))
  }

  function startGame() {
    setGameState(initGame(buildPlayers(botCount), variants, Math.random))
    setPending(null)
    setFlight(null)
    lastTopIdRef.current = null
    setScreen('table')
  }

  const clearFlight = useCallback(() => setFlight(null), [])

  // Whenever a new card reaches the top of the discard pile, send a copy of it
  // flying from its owner's seat so the play is legible rather than instant.
  useLayoutEffect(() => {
    if (!gameState) return
    const top = gameState.discardPile[gameState.discardPile.length - 1]
    if (!top) return

    // First render of a game just records the opening card.
    if (lastTopIdRef.current === null) {
      lastTopIdRef.current = top.id
      return
    }
    if (top.id === lastTopIdRef.current) return
    lastTopIdRef.current = top.id

    const play = [...gameState.log].reverse().find((e) => e.type === 'played' || e.type === 'jumpedIn')
    if (!play || !('playerId' in play)) return

    const source = play.playerId === HUMAN_ID ? handRef.current : seatRefs.current.get(play.playerId)
    if (!source || !discardRef.current) return

    flightSeq.current += 1
    setFlight({ id: flightSeq.current, card: top, from: centreOf(source), to: centreOf(discardRef.current) })
  }, [gameState])

  // Bot turn loop: whenever the game state changes and it's a bot's turn,
  // schedule their move after a randomised pause so play feels dealt rather
  // than instant.
  useEffect(() => {
    if (!gameState || gameState.status !== 'in-progress') return
    const player = gameState.players[gameState.currentPlayerIndex]
    if (!player.isBot) return

    const delay = BOT_DELAY_MIN_MS + Math.random() * (BOT_DELAY_MAX_MS - BOT_DELAY_MIN_MS)
    const timer = setTimeout(() => {
      setGameState((s) => {
        if (!s || s.status !== 'in-progress') return s
        const current = s.players[s.currentPlayerIndex]
        if (current.id !== player.id) return s // state moved on (e.g. a human jump-in) before this fired

        const decision = decideBotMove(s, player.id)
        let next =
          decision.type === 'draw'
            ? gameReducer(s, { type: 'DRAW_CARD', playerId: player.id })
            : gameReducer(s, {
                type: 'PLAY_CARD',
                playerId: player.id,
                card: decision.card,
                chosenColor: decision.chosenColor,
                swapTargetId: decision.swapTargetId,
              })

        if (next.players.find((p) => p.id === player.id)!.hand.length === 1) {
          next = gameReducer(next, { type: 'CALL_UNO', playerId: player.id })
        }
        return next
      })
    }, delay)

    return () => clearTimeout(timer)
  }, [gameState])

  if (screen === 'setup' || !gameState) {
    return (
      <VariantSettingsPanel
        variants={variants}
        onVariantsChange={setVariants}
        botCount={botCount}
        onBotCountChange={setBotCount}
        onStart={startGame}
      />
    )
  }

  const human = gameState.players.find((p) => p.id === HUMAN_ID)!
  const opponents = gameState.players.filter((p) => p.id !== HUMAN_ID)
  const isHumanTurn = gameState.players[gameState.currentPlayerIndex].id === HUMAN_ID
  const topCard = gameState.discardPile.at(-1)!
  const currentPlayer = gameState.players[gameState.currentPlayerIndex]

  const playableIds = new Set(isHumanTurn ? getPlayableCards(human.hand, gameState).map((c) => c.id) : [])
  const jumpInIds = new Set(
    variants.jumpIn ? human.hand.filter((c) => isJumpInEligible(c, gameState)).map((c) => c.id) : [],
  )
  const humanCanCallUno = checkUnoCallRequired(gameState, HUMAN_ID)
  // Covers both causes: nothing legal to play, and a +2/+4 stack with nothing
  // to answer it — getPlayableCards already narrows to stackable cards when a
  // draw is pending.
  const mustDraw = isHumanTurn && gameState.status === 'in-progress' && playableIds.size === 0

  function playHumanCard(card: Card) {
    const isWild = card.value === 'wild' || card.value === 'wild-draw4'
    if (isWild) {
      setPending({ kind: 'color', card, jumpIn: false })
      return
    }
    if (card.value === '7' && variants.sevenZero) {
      setPending({ kind: 'swapTarget', card })
      return
    }
    dispatch({ type: 'PLAY_CARD', playerId: HUMAN_ID, card })
  }

  function jumpInWithCard(card: Card) {
    const isWild = card.value === 'wild' || card.value === 'wild-draw4'
    if (isWild) {
      setPending({ kind: 'color', card, jumpIn: true })
      return
    }
    dispatch({ type: 'JUMP_IN', playerId: HUMAN_ID, card })
  }

  function chooseColor(color: Color) {
    if (!pending || pending.kind !== 'color') return
    if (pending.jumpIn) {
      dispatch({ type: 'JUMP_IN', playerId: HUMAN_ID, card: pending.card, chosenColor: color })
    } else {
      dispatch({ type: 'PLAY_CARD', playerId: HUMAN_ID, card: pending.card, chosenColor: color })
    }
    setPending(null)
  }

  function chooseSwapTarget(playerId: string) {
    if (!pending || pending.kind !== 'swapTarget') return
    dispatch({ type: 'PLAY_CARD', playerId: HUMAN_ID, card: pending.card, swapTargetId: playerId })
    setPending(null)
  }

  // Seats arc away from the centre: the middle seat sits highest.
  const seatMid = (opponents.length - 1) / 2

  const felt = FELT[gameState.activeColor]

  return (
    // The felt itself is recoloured to whatever colour is in play; the
    // registered custom properties ease the whole gradient between palettes.
    <div
      className={styles.table}
      style={
        {
          '--felt-hi': felt.hi,
          '--felt-mid': felt.mid,
          '--felt-lo': felt.lo,
          '--felt-edge': felt.edge,
        } as CSSProperties
      }
    >
      <EventLog log={gameState.log} players={gameState.players} />

      <div className={styles.seats}>
        {opponents.map((p, i) => (
          <div
            key={p.id}
            style={{ marginTop: `${Math.abs(i - seatMid) * 16}px` }}
            ref={(el) => {
              if (el) seatRefs.current.set(p.id, el)
              else seatRefs.current.delete(p.id)
            }}
          >
            <OpponentHandBadge
              player={p}
              isTurn={currentPlayer.id === p.id}
              canChallenge={p.hand.length === 1 && !p.calledUno}
              onChallenge={() => dispatch({ type: 'CHALLENGE_UNO', accusedId: p.id })}
            />
          </div>
        ))}
      </div>

      <div className={styles.play}>
        <div className={styles.playRing} />
        {mustDraw && <DrawCallout pendingDraw={gameState.pendingDrawCount} />}
        {/* Kept in flow even while hidden so the piles never shift position. */}
        <div className={mustDraw ? styles.hidden : undefined}>
          <TurnIndicator
            label={isHumanTurn ? 'Your turn' : `${currentPlayer.name}'s turn`}
            direction={gameState.direction}
            highlight={isHumanTurn}
          />
        </div>
        <div className={styles.piles}>
          <DrawPile
            count={gameState.drawPile.length}
            disabled={!isHumanTurn}
            pendingDraw={isHumanTurn ? gameState.pendingDrawCount : 0}
            onDraw={() => dispatch({ type: 'DRAW_CARD', playerId: HUMAN_ID })}
          />
          <DiscardPile
            pile={gameState.discardPile}
            activeColor={gameState.activeColor}
            hideTop={flight?.card.id === topCard.id}
            pileRef={discardRef}
          />
        </div>
      </div>

      <div className={styles.hand} ref={handRef}>
        <div className={styles.handBar}>
          {humanCanCallUno && (
            <button type="button" className={styles.unoButton} onClick={() => dispatch({ type: 'CALL_UNO', playerId: HUMAN_ID })}>
              UNO!
            </button>
          )}
        </div>
        <PlayerHandFan
          hand={human.hand}
          playableIds={playableIds}
          jumpInIds={jumpInIds}
          onPlay={playHumanCard}
          onJumpIn={jumpInWithCard}
        />
      </div>

      {flight && (
        <FlyingCard key={flight.id} card={flight.card} from={flight.from} to={flight.to} onDone={clearFlight} />
      )}

      <ColorPickerModal open={pending?.kind === 'color'} onChoose={chooseColor} />
      <SwapTargetModal open={pending?.kind === 'swapTarget'} opponents={opponents} onChoose={chooseSwapTarget} />
      <WinModal
        open={gameState.status === 'won'}
        winnerName={gameState.players.find((p) => p.id === gameState.winnerId)?.name ?? null}
        playerWon={gameState.winnerId === HUMAN_ID}
        onPlayAgain={startGame}
      />
    </div>
  )
}
