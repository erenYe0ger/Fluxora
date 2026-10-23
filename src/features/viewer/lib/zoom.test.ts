import { describe, expect, it } from 'vitest'
import { MAX_SCALE, MIN_SCALE, clampScale, fitWidthScale, zoomIn, zoomOut } from './zoom'

describe('zoom', () => {
  it('clamps within limits', () => {
    expect(clampScale(100)).toBe(MAX_SCALE)
    expect(clampScale(0)).toBe(MIN_SCALE)
  })

  it('steps in and out symmetrically', () => {
    expect(zoomIn(1)).toBeCloseTo(1.2)
    expect(zoomOut(1.2)).toBeCloseTo(1)
  })

  it('fits width minus the gutter', () => {
    // 1000px container, 48px gutter, 500px page => 1.904
    expect(fitWidthScale(1000, 500)).toBeCloseTo(1.904, 3)
  })

  it('falls back when dimensions are unknown', () => {
    expect(fitWidthScale(0, 500, 48, 1.25)).toBe(1.25)
    expect(fitWidthScale(1000, 0, 48, 1.25)).toBe(1.25)
  })
})
