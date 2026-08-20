const PREVIEW: { letter: string; color: string }[] = [
  { letter: 'W', color: 'var(--wordle-correct)' },
  { letter: 'O', color: 'var(--wordle-present)' },
  { letter: 'R', color: 'var(--wordle-absent)' },
]

export function ThumbnailIcon() {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {PREVIEW.map(({ letter, color }) => (
        <div
          key={letter}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            background: color,
            color: 'white',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {letter}
        </div>
      ))}
    </div>
  )
}
