import { describe, expect, it } from 'vitest'
import { hexToHsv, hsvToHex, parseHex } from './color'

describe('parseHex', () => {
  it('accepts colours with and without a hash', () => {
    expect(parseHex('#ff8a3d')).toEqual({ r: 255, g: 138, b: 61 })
    expect(parseHex('ff8a3d')).toEqual({ r: 255, g: 138, b: 61 })
  })

  it('rejects malformed values', () => {
    expect(parseHex('nope')).toBeNull()
    expect(parseHex('#fff')).toBeNull()
  })
})

describe('hsvToHex', () => {
  it('maps the primaries', () => {
    expect(hsvToHex(0, 1, 1)).toBe('#ff0000')
    expect(hsvToHex(120, 1, 1)).toBe('#00ff00')
    expect(hsvToHex(240, 1, 1)).toBe('#0000ff')
  })

  it('maps black, white and grey', () => {
    expect(hsvToHex(200, 1, 0)).toBe('#000000')
    expect(hsvToHex(200, 0, 1)).toBe('#ffffff')
    expect(hsvToHex(200, 0, 0.5)).toBe('#808080')
  })

  it('wraps hues outside 0-360', () => {
    expect(hsvToHex(360, 1, 1)).toBe(hsvToHex(0, 1, 1))
    expect(hsvToHex(-120, 1, 1)).toBe(hsvToHex(240, 1, 1))
  })
})

describe('hexToHsv', () => {
  it('round-trips through hsvToHex', () => {
    for (const colour of ['#fde047', '#8ce7a8', '#93c5fd', '#ff8a3d', '#123456', '#ffffff', '#000000']) {
      const hsv = hexToHsv(colour)
      expect(hsvToHex(hsv.h, hsv.s, hsv.v)).toBe(colour)
    }
  })

  it('reports grey as zero saturation and black as zero value', () => {
    expect(hexToHsv('#808080').s).toBe(0)
    expect(hexToHsv('#000000').v).toBe(0)
  })

  it('falls back to black for unparseable input', () => {
    expect(hexToHsv('nope')).toEqual({ h: 0, s: 0, v: 0 })
  })
})
