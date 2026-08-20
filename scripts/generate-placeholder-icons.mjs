// Generates placeholder PWA icons (flat rounded-square background + simple
// card glyph) as raw PNGs, using only Node's built-in zlib for compression.
// No image/canvas dependency needed. Re-run any time real artwork replaces
// these: `node scripts/generate-placeholder-icons.mjs`.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

const BG = [30, 30, 46, 255] // #1e1e2e
const CARD = [244, 244, 249, 255] // #f4f4f9
const ACCENT = [255, 82, 82, 255] // #ff5252

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v))
}

function insideRoundedRect(px, py, x, y, w, h, r) {
  if (px < x || px > x + w || py < y || py > y + h) return false
  const cx = clamp(px, x + r, x + w - r)
  const cy = clamp(py, y + r, y + h - r)
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

function renderIcon(size, { padded = false } = {}) {
  // `padded` leaves extra safe-zone margin for maskable icons.
  const pixels = Buffer.alloc(size * size * 4)
  const outerPad = padded ? size * 0.1 : 0
  const bgSize = size - outerPad * 2
  const bgRadius = bgSize * 0.22

  const cardW = bgSize * 0.42
  const cardH = bgSize * 0.6
  const cardX = outerPad + (bgSize - cardW) / 2
  const cardY = outerPad + (bgSize - cardH) / 2
  const cardRadius = cardW * 0.16

  const dotRadius = bgSize * 0.09
  const dotCx = outerPad + bgSize / 2
  const dotCy = outerPad + bgSize / 2

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const i = (py * size + px) * 4
      let color = null

      if (insideRoundedRect(px, py, outerPad, outerPad, bgSize, bgSize, bgRadius)) {
        color = BG
        if (insideRoundedRect(px, py, cardX, cardY, cardW, cardH, cardRadius)) {
          color = CARD
        }
        const ddx = px - dotCx
        const ddy = py - dotCy
        if (ddx * ddx + ddy * ddy <= dotRadius * dotRadius) {
          color = ACCENT
        }
      }

      if (color) {
        pixels[i] = color[0]
        pixels[i + 1] = color[1]
        pixels[i + 2] = color[2]
        pixels[i + 3] = color[3]
      } else {
        pixels[i] = 0
        pixels[i + 1] = 0
        pixels[i + 2] = 0
        pixels[i + 3] = 0
      }
    }
  }
  return pixels
}

// ---- minimal PNG encoder ----
const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

function encodePNG(size, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 6 // color type RGBA
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = chunk('IHDR', ihdrData)

  const raw = Buffer.alloc(size * (1 + size * 4))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0 // no filter
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  const idat = chunk('IDAT', deflateSync(raw))
  const iend = chunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512, padded: true },
  { file: 'apple-touch-icon.png', size: 180 },
]

for (const t of targets) {
  const pixels = renderIcon(t.size, { padded: t.padded })
  const png = encodePNG(t.size, pixels)
  const outPath = path.join(outDir, t.file)
  writeFileSync(outPath, png)
  console.log(`wrote ${outPath} (${t.size}x${t.size})`)
}
