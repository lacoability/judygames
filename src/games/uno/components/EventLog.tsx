import type { GameEvent, Player } from '../engine/types'
import styles from './EventLog.module.css'

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? id
}

function describeEvent(event: GameEvent, players: Player[]): string | null {
  switch (event.type) {
    case 'played':
      return `${playerName(players, event.playerId)} played ${event.card.color ?? 'wild'} ${event.card.value}`
    case 'drew':
      return `${playerName(players, event.playerId)} drew ${event.count} card${event.count === 1 ? '' : 's'}`
    case 'jumpedIn':
      return `${playerName(players, event.playerId)} jumped in!`
    case 'calledUno':
      return `${playerName(players, event.playerId)} called Uno!`
    case 'unoPenalty':
      return `${playerName(players, event.playerId)} got caught without calling Uno — drew ${event.count}`
    case 'skipped':
      return `${playerName(players, event.playerId)} was skipped`
    case 'reversed':
      return 'Direction reversed'
    case 'swapped':
      return `${playerName(players, event.playerId)} swapped hands with ${playerName(players, event.withPlayerId)}`
    case 'rotated':
      return 'Everyone passed their hand'
    case 'colorChosen':
      return `${playerName(players, event.playerId)} chose ${event.color}`
    case 'won':
      return `${playerName(players, event.playerId)} wins!`
    default:
      return null
  }
}

interface EventLogProps {
  log: GameEvent[]
  players: Player[]
}

export function EventLog({ log, players }: EventLogProps) {
  const last = log.at(-1)
  const message = last ? describeEvent(last, players) : null
  if (!message) return null

  return (
    <div className={styles.toastWrap}>
      <div key={log.length} className={styles.toast}>
        {message}
      </div>
    </div>
  )
}
