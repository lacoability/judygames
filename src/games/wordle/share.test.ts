import { describe, expect, it } from 'vitest'
import { buildShareText } from './share'

describe('buildShareText', () => {
  it('renders a green/yellow/gray grid with the guess count for a win, padded to 6 rows', () => {
    const text = buildShareText(146, ['crate', 'slate'], 'slate', 'won')
    expect(text).toBe(
      'Wordle #146 2/6\n\n⬛⬛🟩🟩🟩\n🟩🟩🟩🟩🟩\n⬜⬜⬜⬜⬜\n⬜⬜⬜⬜⬜\n⬜⬜⬜⬜⬜\n⬜⬜⬜⬜⬜',
    )
  })

  it('uses X/6 for a loss, with all 6 rows already played', () => {
    const guesses = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee', 'fffff']
    const text = buildShareText(1, guesses, 'ggggg', 'lost')
    expect(text.startsWith('Wordle #1 X/6')).toBe(true)
    expect(text.split('\n')).toHaveLength(2 + 6)
  })
})
