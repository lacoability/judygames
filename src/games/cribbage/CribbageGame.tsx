import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GameState } from './engine/types'
import { initGame } from './engine/deal'
import { gameReducer, type GameAction } from './engine/gameReducer'
import { getPlayer, legalPeggingCards, otherPlayerId } from './engine/pegging'
import { chooseDiscard, choosePeggingPlay } from './bot/botAI'
import { useGameStats } from '../../shared/hooks/useGameStats'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import { Button } from '../../shared/components/Button'
import { Modal } from '../../shared/components/Modal'
import { Hand } from './components/Hand'
import { OpponentHand } from './components/OpponentHand'
import { PeggingTable } from './components/PeggingTable'
import { StarterCard } from './components/StarterCard'
import { CribPile } from './components/CribPile'
import { PegBoard } from './components/PegBoard'
import { ScoreReveal } from './components/ScoreReveal'
import { WinModal } from './components/WinModal'
import styles from './CribbageGame.module.css'

const HUMAN_ID = 'human'
const BOT_ID = 'bot'
const BOT_NAME = 'Nibs'

const BOT_DELAY_MIN_MS = 700
const BOT_DELAY_MAX_MS = 2200

function botDelay() {
  return BOT_DELAY_MIN_MS + Math.random() * (BOT_DELAY_MAX_MS - BOT_DELAY_MIN_MS)
}

export function CribbageGame() {
  const navigate = useNavigate()
  const [screen, setScreen] = useState<'setup' | 'table'>('setup')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [selectedDiscardIds, setSelectedDiscardIds] = useState<Set<string>>(new Set())
  const [revealFinished, setRevealFinished] = useState(false)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const statsRecordedRef = useRef(false)

  const { stats, record } = useGameStats('cribbage')

  function dispatch(action: GameAction) {
    setGameState((s) => (s ? gameReducer(s, action) : s))
  }

  function startGame() {
    setGameState(
      initGame([
        { id: HUMAN_ID, name: 'You', isBot: false },
        { id: BOT_ID, name: BOT_NAME, isBot: true },
      ]),
    )
    setSelectedDiscardIds(new Set())
    setRevealFinished(false)
    statsRecordedRef.current = false
    setScreen('table')
  }

  useEffect(() => {
    if (!gameState || gameState.status !== 'won' || statsRecordedRef.current) return
    statsRecordedRef.current = true
    record(gameState.winnerId === HUMAN_ID)
  }, [gameState, record])

  // Bot's discard: decides and confirms shortly after the hand is dealt (or
  // whenever a fresh hand starts), independent of whether the human has.
  useEffect(() => {
    if (!gameState || gameState.phase !== 'discard') return
    if (gameState.pendingDiscards[BOT_ID]) return
    const timer = setTimeout(() => {
      setGameState((s) => {
        if (!s || s.phase !== 'discard' || s.pendingDiscards[BOT_ID]) return s
        const bot = getPlayer(s, BOT_ID)
        const [d1, d2] = chooseDiscard(bot.hand, s.dealerId === BOT_ID)
        return gameReducer(s, { type: 'CONFIRM_DISCARD', playerId: BOT_ID, cardIds: [d1.id, d2.id] })
      })
    }, botDelay())
    return () => clearTimeout(timer)
  }, [gameState])

  // Bot's pegging turn.
  useEffect(() => {
    if (!gameState || gameState.phase !== 'pegging' || !gameState.pegging) return
    if (gameState.pegging.turnPlayerId !== BOT_ID) return
    const timer = setTimeout(() => {
      setGameState((s) => {
        if (!s || s.phase !== 'pegging' || !s.pegging || s.pegging.turnPlayerId !== BOT_ID) return s
        const bot = getPlayer(s, BOT_ID)
        const legal = legalPeggingCards(bot.peggingHand, s.pegging.count)
        const decision = choosePeggingPlay(
          legal,
          s.pegging.count,
          s.pegging.sequence.map((e) => e.card),
        )
        return decision.type === 'go'
          ? gameReducer(s, { type: 'SAY_GO', playerId: BOT_ID })
          : gameReducer(s, { type: 'PLAY_PEG_CARD', playerId: BOT_ID, card: decision.card })
      })
    }, botDelay())
    return () => clearTimeout(timer)
  }, [gameState])

  if (screen === 'setup' || !gameState) {
    return (
      <div className={styles.setup}>
        <button type="button" className={styles.setupExit} onClick={() => navigate('/')} aria-label="Back to hub">
          ✕
        </button>
        <div className={styles.setupCard}>
          <h1 className={styles.setupTitle}>Cribbage</h1>
          <p className={styles.setupBlurb}>First to 121 wins. You vs. {BOT_NAME}, standard two-player rules.</p>
          <div className={styles.setupStats}>
            <div>
              <div className={styles.setupStatValue}>{stats.wins}</div>
              <div className={styles.setupStatLabel}>Wins</div>
            </div>
            <div>
              <div className={styles.setupStatValue}>{stats.losses}</div>
              <div className={styles.setupStatLabel}>Losses</div>
            </div>
            <div>
              <div className={styles.setupStatValue}>{stats.currentStreak}</div>
              <div className={styles.setupStatLabel}>Streak</div>
            </div>
          </div>
          <Button onClick={startGame}>Deal In</Button>
        </div>
      </div>
    )
  }

  const human = getPlayer(gameState, HUMAN_ID)
  const bot = getPlayer(gameState, BOT_ID)
  const isBotDealer = gameState.dealerId === BOT_ID

  const humanSelectedDiscard = selectedDiscardIds
  const discardEnabledIds =
    gameState.phase === 'discard'
      ? new Set(humanSelectedDiscard.size >= 2 ? humanSelectedDiscard : human.hand.map((c) => c.id))
      : new Set<string>()

  const peggingCount = gameState.pegging?.count ?? 0
  const isHumanPeggingTurn = gameState.phase === 'pegging' && gameState.pegging?.turnPlayerId === HUMAN_ID
  const humanLegalPegCards = isHumanPeggingTurn ? legalPeggingCards(human.peggingHand, peggingCount) : []
  const humanMustGo = isHumanPeggingTurn && humanLegalPegCards.length === 0
  const peggingEnabledIds = new Set(humanLegalPegCards.map((c) => c.id))

  function toggleDiscardCard(cardId: string) {
    setSelectedDiscardIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else if (next.size < 2) next.add(cardId)
      return next
    })
  }

  function sendToCrib() {
    if (selectedDiscardIds.size !== 2) return
    const [id1, id2] = [...selectedDiscardIds]
    dispatch({ type: 'CONFIRM_DISCARD', playerId: HUMAN_ID, cardIds: [id1, id2] })
    setSelectedDiscardIds(new Set())
  }

  function handleShowContinue() {
    if (!gameState) return
    if (gameState.status === 'won') {
      setRevealFinished(true)
    } else {
      dispatch({ type: 'START_NEXT_HAND' })
      setRevealFinished(false)
    }
  }

  const showReveal = gameState.showStages.length > 0 && !revealFinished
  const showWinModal = gameState.status === 'won' && !showReveal

  const phaseMessage =
    gameState.phase === 'discard'
      ? gameState.pendingDiscards[HUMAN_ID]
        ? `Waiting for ${BOT_NAME} to discard...`
        : 'Pick 2 cards to send to the crib'
      : gameState.phase === 'pegging'
        ? humanMustGo
          ? 'No legal play — say Go'
          : isHumanPeggingTurn
            ? 'Your turn to peg'
            : `${BOT_NAME}'s turn`
        : ''

  return (
    <div className={styles.table}>
      <PegBoard
        players={[
          { id: HUMAN_ID, name: 'You', score: gameState.scores[HUMAN_ID] ?? 0, metal: 'steel' },
          { id: BOT_ID, name: BOT_NAME, score: gameState.scores[BOT_ID] ?? 0, metal: 'brass' },
        ]}
      />

      <div className={styles.opponentRow}>
        <button type="button" className={styles.exitButton} onClick={() => setConfirmExitOpen(true)} aria-label="Leave game">
          ✕
        </button>
        <OpponentHand
          name={BOT_NAME}
          count={gameState.phase === 'discard' ? bot.hand.length : bot.peggingHand.length}
          isTurn={gameState.phase === 'pegging' && gameState.pegging?.turnPlayerId === BOT_ID}
          isDealer={isBotDealer}
          isStuck={gameState.pegging?.stuck.includes(BOT_ID) ?? false}
        />
      </div>

      <div className={styles.message}>{phaseMessage}</div>

      <div className={styles.play}>
        <div className={styles.centerRow}>
          <StarterCard
            deckCount={gameState.deck.length}
            starter={gameState.starter}
            heels={gameState.log.some((e) => e.type === 'hisHeels')}
          />
          {gameState.phase === 'pegging' && (
            <CribPile cards={gameState.crib} revealed={false} label={gameState.dealerId === HUMAN_ID ? 'Your crib' : `${BOT_NAME}'s crib`} />
          )}
        </div>
        {gameState.phase === 'pegging' && gameState.pegging && (
          <PeggingTable
            sequence={gameState.pegging.sequence}
            count={peggingCount}
            humanMustGo={humanMustGo}
            onGo={() => dispatch({ type: 'SAY_GO', playerId: HUMAN_ID })}
          />
        )}
      </div>

      <div className={styles.hand}>
        {gameState.phase === 'discard' && (
          <div className={styles.handBar}>
            <Button variant="primary" onClick={sendToCrib} disabled={selectedDiscardIds.size !== 2}>
              Send to Crib ({selectedDiscardIds.size}/2)
            </Button>
          </div>
        )}
        <Hand
          hand={gameState.phase === 'discard' ? human.hand : human.peggingHand}
          enabledIds={gameState.phase === 'discard' ? discardEnabledIds : peggingEnabledIds}
          selectedIds={gameState.phase === 'discard' ? selectedDiscardIds : undefined}
          onCardClick={
            gameState.phase === 'discard'
              ? (card) => toggleDiscardCard(card.id)
              : (card) => dispatch({ type: 'PLAY_PEG_CARD', playerId: HUMAN_ID, card })
          }
        />
      </div>

      <Modal open={showReveal} variant="sheet">
        <ScoreReveal
          stages={gameState.showStages}
          possessiveNames={{ [HUMAN_ID]: 'Your', [BOT_ID]: `${BOT_NAME}'s` }}
          onFinished={handleShowContinue}
        />
      </Modal>

      <WinModal
        open={showWinModal}
        winnerName={gameState.winnerId === BOT_ID ? BOT_NAME : 'You'}
        playerWon={gameState.winnerId === HUMAN_ID}
        winnerScore={gameState.winnerId ? (gameState.scores[gameState.winnerId] ?? 0) : 0}
        loserScore={gameState.winnerId ? (gameState.scores[otherPlayerId(gameState, gameState.winnerId)] ?? 0) : 0}
        stats={stats}
        onPlayAgain={startGame}
      />

      <ConfirmModal
        open={confirmExitOpen}
        title="Leave game?"
        message="Your progress in this game will be lost."
        confirmLabel="Leave"
        onConfirm={() => navigate('/')}
        onCancel={() => setConfirmExitOpen(false)}
      />
    </div>
  )
}
