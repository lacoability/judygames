import type { GameModule } from '../../shared/types/GameModule'
import { WordleGame } from './WordleGame'
import { ThumbnailIcon } from './ThumbnailIcon'
import { TOTAL_PUZZLES } from './engine/words'

// "Wordle" is a trademark of The New York Times Company — kept generic here
// the same way the Uno-style game is "Wild Cards" rather than "Uno".
export const wordleGameModule: GameModule = {
  id: 'word-guess',
  name: 'Word Guess',
  description: `Guess the 5-letter word in 6 tries. ${TOTAL_PUZZLES} puzzles, play them in any order.`,
  route: '/games/word-guess',
  accentColor: 'var(--wordle-correct)',
  ThumbnailIcon,
  Component: WordleGame,
}
