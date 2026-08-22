import { describe, expect, it } from 'vitest'
import { buildShareText } from './share'

describe('buildShareText', () => {
  it('renders a green/yellow/gray grid padded to 6 rows, with the guess count below it', () => {
    const text = buildShareText(146, ['crate', 'slate'], 'slate', 'won')
    expect(text).toBe(
      'Word #146\n\n⬛⬛🟩🟩🟩\n🟩🟩🟩🟩🟩\n⬜⬜⬜⬜⬜\n⬜⬜⬜⬜⬜\n⬜⬜⬜⬜⬜\n⬜⬜⬜⬜⬜\n\nGuesses: 2/6',
    )
  })

  it('uses X/6 for a loss, with all 6 rows already played', () => {
    const guesses = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee', 'fffff']
    const text = buildShareText(1, guesses, 'ggggg', 'lost')
    expect(text.startsWith('Word #1\n')).toBe(true)
    expect(text.endsWith('Guesses: X/6')).toBe(true)
    // Header, blank, six played rows, blank, guess count — no padding needed.
    expect(text.split('\n')).toHaveLength(10)
  })
})
