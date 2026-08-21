import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clampPuzzleIndex, getAnswer, TOTAL_PUZZLES } from './engine/words'
import { keyboardStatuses } from './engine/evaluate'
import { initPuzzleState, wordleReducer, type WordleAction, type WordleState } from './engine/reducer'
import { loadAttempt, loadAttempts, loadLastPuzzleIndex, saveAttempt, saveLastPuzzleIndex, computeStats } from './storage'
import { Board } from './components/Board'
import { Keyboard } from './components/Keyboard'
import { PuzzleNav } from './components/PuzzleNav'
import { ResultModal } from './components/ResultModal'
import { StatsModal } from './components/StatsModal'
import { ConfirmModal } from '../../shared/components/ConfirmModal'
import styles from './WordleGame.module.css'

function loadPuzzleState(puzzleIndex: number): WordleState {
  const answer = getAnswer(puzzleIndex)
  const restored = loadAttempt(puzzleIndex)
  return initPuzzleState(puzzleIndex, answer, restored ?? undefined)
}

export function WordleGame() {
  const navigate = useNavigate()

  const [puzzleIndex, setPuzzleIndex] = useState(() => clampPuzzleIndex(loadLastPuzzleIndex() ?? 0))
  const [state, setState] = useState<WordleState>(() => loadPuzzleState(puzzleIndex))
  const [showResult, setShowResult] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)
  const [animateRowIndex, setAnimateRowIndex] = useState<number | null>(null)
  const [attemptsVersion, setAttemptsVersion] = useState(0)

  const prevStatusRef = useRef(state.status)
  const prevGuessCountRef = useRef(state.guesses.length)

  // attemptsVersion isn't read inside the callback — it exists purely to
  // force this to recompute after the effect below writes a fresh attempt
  // to storage, since computeStats reads storage directly rather than props/state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => computeStats(loadAttempts()), [attemptsVersion])

  function dispatch(action: WordleAction) {
    setState((s) => wordleReducer(s, action))
  }

  function goToPuzzle(index: number) {
    const clamped = clampPuzzleIndex(index)
    const next = loadPuzzleState(clamped)
    prevStatusRef.current = next.status
    prevGuessCountRef.current = next.guesses.length
    setAnimateRowIndex(null)
    setPuzzleIndex(clamped)
    saveLastPuzzleIndex(clamped)
    setState(next)
    setShowResult(false)
  }

  // Persist every change, skipping the pristine untouched case (handled
  // inside saveAttempt) so merely browsing past a puzzle doesn't save it.
  useEffect(() => {
    saveAttempt(state.puzzleIndex, { guesses: state.guesses, status: state.status })
    setAttemptsVersion((v) => v + 1)
  }, [state.puzzleIndex, state.guesses, state.status])

  // Auto-opens the result modal exactly once, the moment THIS session's play
  // finishes the puzzle — not when loading an already-finished puzzle.
  useEffect(() => {
    if (prevStatusRef.current === 'in-progress' && state.status !== 'in-progress') {
      setShowResult(true)
    }
    prevStatusRef.current = state.status
  }, [state.status])

  // Flags the row that was just submitted so only it plays the flip-reveal —
  // restored rows from a reloaded puzzle render already-settled.
  useEffect(() => {
    if (state.guesses.length > prevGuessCountRef.current) {
      setAnimateRowIndex(state.guesses.length - 1)
    }
    prevGuessCountRef.current = state.guesses.length
  }, [state.guesses.length])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (state.status !== 'in-progress' || showResult || showStats || confirmExitOpen) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'Enter') dispatch({ type: 'SUBMIT_GUESS' })
      else if (e.key === 'Backspace') dispatch({ type: 'BACKSPACE' })
      else if (/^[a-zA-Z]$/.test(e.key)) dispatch({ type: 'TYPE_LETTER', letter: e.key })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [state.status, showResult, showStats, confirmExitOpen])

  const puzzleNumber = puzzleIndex + 1
  const letterStatuses = keyboardStatuses(state.guesses, state.answer)

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <button type="button" className={styles.iconButton} onClick={() => setConfirmExitOpen(true)} aria-label="Leave game">
          ✕
        </button>
        <PuzzleNav
          puzzleNumber={puzzleNumber}
          totalPuzzles={TOTAL_PUZZLES}
          status={state.status}
          onNavigate={goToPuzzle}
        />
        <button type="button" className={styles.iconButton} onClick={() => setShowStats(true)} aria-label="View stats">
          📊
        </button>
      </header>

      <div className={styles.boardWrap}>
        <Board
          guesses={state.guesses}
          currentGuess={state.currentGuess}
          answer={state.answer}
          status={state.status}
          invalidPulse={state.invalidPulse}
          animateRowIndex={animateRowIndex}
        />
      </div>

      {state.status !== 'in-progress' && !showResult && (
        <button type="button" className={styles.reopenResult} onClick={() => setShowResult(true)}>
          {state.status === 'won' ? `Solved in ${state.guesses.length}` : 'Not solved'} — view result
        </button>
      )}

      <Keyboard
        statuses={letterStatuses}
        disabled={state.status !== 'in-progress'}
        onLetter={(letter) => dispatch({ type: 'TYPE_LETTER', letter })}
        onEnter={() => dispatch({ type: 'SUBMIT_GUESS' })}
        onBackspace={() => dispatch({ type: 'BACKSPACE' })}
      />

      <ResultModal
        open={showResult}
        status={state.status}
        puzzleNumber={puzzleNumber}
        guesses={state.guesses}
        answer={state.answer}
        stats={stats}
        hasNextPuzzle={puzzleIndex < TOTAL_PUZZLES - 1}
        onNext={() => goToPuzzle(puzzleIndex + 1)}
        onClose={() => setShowResult(false)}
      />

      <StatsModal open={showStats} stats={stats} totalPuzzles={TOTAL_PUZZLES} onClose={() => setShowStats(false)} />

      <ConfirmModal
        open={confirmExitOpen}
        title="Leave the puzzle?"
        message="Your progress on this puzzle is saved, so you can pick it back up any time."
        confirmLabel="Leave"
        onConfirm={() => navigate('/')}
        onCancel={() => setConfirmExitOpen(false)}
      />
    </div>
  )
}
