import { describe, expect, it } from 'vitest'
import { contrastInk, markerCursor } from './cursor'

describe('markerCursor', () => {
  it('is a custom cursor with a crosshair fallback', () => {
    const cursor = markerCursor('#fde047')
    expect(cursor.startsWith('url("data:image/svg+xml,')).toBe(true)
    expect(cursor.endsWith(', crosshair')).toBe(true)
  })

  it('encodes the active colour inside the SVG', () => {
    const cursor = markerCursor('#ff8a3d')
    expect(decodeURIComponent(cursor)).toContain('fill="#ff8a3d"')
  })

  it('re-encodes when the colour changes', () => {
    expect(markerCursor('#8ce7a8')).not.toBe(markerCursor('#fde047'))
  })

  it('leaves no raw characters that would break a CSS url()', () => {
    const inner = markerCursor('#93c5fd')
      .replace(/^url\("data:image\/svg\+xml,/, '')
      .replace(/"\) 3 22, crosshair$/, '')
    expect(inner).not.toContain(' ')
    expect(inner).not.toContain('"')
  })
})

describe('contrastInk', () => {
  it('uses dark ink on light swatches', () => {
    expect(contrastInk('#fde047')).toBe('#0a0c11')
    expect(contrastInk('#ffffff')).toBe('#0a0c11')
  })

  it('uses light ink on dark swatches', () => {
    expect(contrastInk('#1e3a8a')).toBe('#ffffff')
    expect(contrastInk('#000000')).toBe('#ffffff')
  })

  it('falls back to dark ink for unparseable colours', () => {
    expect(contrastInk('not-a-colour')).toBe('#0a0c11')
  })

  it('accepts colours with or without the leading hash', () => {
    expect(contrastInk('#fde047')).toBe(contrastInk('fde047'))
  })
})
