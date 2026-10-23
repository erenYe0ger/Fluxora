import { describe, expect, it } from 'vitest'
import { MAX_SCALE, MIN_SCALE, clampScale, fitPageScale, zoomIn, zoomOut } from './zoom'

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

describe('fitPageScale', () => {
  it('never exceeds the available width', () => {
    // Wide, short viewport: width is the limiting axis.
    expect(fitPageScale({ width: 1000, height: 2000 }, { width: 500, height: 700 })).toBeCloseTo(2)
  })

  it('never exceeds the available height', () => {
    // Tall, narrow viewport: height limits the scale.
    expect(fitPageScale({ width: 2000, height: 700 }, { width: 500, height: 700 })).toBeCloseTo(1)
  })

  it('leaves the inset free on all four sides', () => {
    // 1000 wide with 100px inset each side leaves 800 for a 500pt page.
    expect(fitPageScale({ width: 1000, height: 2000 }, { width: 500, height: 500 }, 100)).toBeCloseTo(
      1.6
    )
  })

  it('grows a small page instead of leaving it tiny', () => {
    expect(fitPageScale({ width: 1200, height: 900 }, { width: 300, height: 200 })).toBeCloseTo(4)
  })

  it('falls back when dimensions are unknown or the inset eats the box', () => {
    expect(fitPageScale({ width: 0, height: 0 }, { width: 500, height: 700 }, 0, 1.25)).toBe(1.25)
    expect(fitPageScale({ width: 100, height: 100 }, { width: 500, height: 700 }, 60, 1.25)).toBe(
      1.25
    )
  })
})
