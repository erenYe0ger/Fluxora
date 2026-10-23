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
})

describe('fitWidthScale', () => {
  it('fills the width minus the inset on both sides', () => {
    // 1000px area, 24px inset each side, 600pt page => 952/600
    expect(fitWidthScale(1000, 600, 24)).toBeCloseTo(1.587, 3)
  })

  it('scales down a page wider than the viewport', () => {
    expect(fitWidthScale(500, 1000, 0)).toBeCloseTo(0.5)
  })

  it('scales a small page up', () => {
    expect(fitWidthScale(1000, 500, 0)).toBeCloseTo(2)
  })

  it('falls back when dimensions are unknown or the inset eats the box', () => {
    expect(fitWidthScale(0, 500, 0, 1.25)).toBe(1.25)
    expect(fitWidthScale(1000, 0, 0, 1.25)).toBe(1.25)
    expect(fitWidthScale(40, 500, 24, 1.25)).toBe(1.25)
  })

  it('never exceeds the zoom ceiling', () => {
    expect(fitWidthScale(10000, 100, 0)).toBe(MAX_SCALE)
  })
})
