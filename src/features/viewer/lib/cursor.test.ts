import { describe, expect, it } from 'vitest'
import { markerCursor, selectCursor } from './cursor'

const decode = (cursor: string) => decodeURIComponent(cursor)

function inner(cursor: string) {
  return cursor
    .replace(/^url\("data:image\/svg\+xml,/, '')
    .replace(/"\) [\d ]+, [a-z]+$/, '')
}

describe('markerCursor', () => {
  it('is a custom cursor with a crosshair fallback', () => {
    expect(markerCursor('#fde047').startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(markerCursor('#fde047').endsWith(', crosshair')).toBe(true)
  })

  it('draws the same glyph as the toolbar highlighter', () => {
    const svg = decode(markerCursor('#fde047'))
    expect(svg).toContain('m14 4 6 6-8.2 8.2H6.2v-5.6z')
    expect(svg).toContain('M4 21h9')
  })

  it('fills the glyph with the active colour and outlines it in black', () => {
    const svg = decode(markerCursor('#ff8a3d'))
    expect(svg).toContain('fill="#ff8a3d"')
    expect(svg).toContain('stroke="#000"')
  })

  it('changes with the colour', () => {
    expect(markerCursor('#8ce7a8')).not.toBe(markerCursor('#fde047'))
  })

  it('leaves no raw characters that would break a CSS url()', () => {
    expect(inner(markerCursor('#93c5fd'))).not.toContain(' ')
    expect(inner(markerCursor('#93c5fd'))).not.toContain('"')
  })
})

describe('selectCursor', () => {
  it('uses the toolbar arrow glyph', () => {
    expect(decode(selectCursor())).toContain('m5.5 3.5 6.4 16.4 2.2-6.2 6.4-2.2z')
  })

  it('is filled, not just stroked', () => {
    const svg = decode(selectCursor())
    expect(svg).toContain('fill="#0a0c11"')
    expect(svg).toContain('stroke="#fff"')
  })

  it('falls back to the normal arrow and is encode-safe', () => {
    expect(selectCursor().endsWith(', default')).toBe(true)
    expect(inner(selectCursor())).not.toContain('"')
  })
})
