import { describe, expect, it } from 'vitest'
import { clampRect, normalizeRect, toCssBox } from './geometry'

describe('normalizeRect', () => {
  it('maps a DOM rect into page-relative space', () => {
    const page = { left: 100, top: 50, width: 200, height: 400 }
    const rect = { left: 150, top: 150, width: 50, height: 20 }
    expect(normalizeRect(rect, page)).toEqual({
      x: 0.25,
      y: 0.25,
      width: 0.25,
      height: 0.05
    })
  })

  it('returns an empty rect for a zero-sized page', () => {
    const rect = { left: 10, top: 10, width: 5, height: 5 }
    expect(normalizeRect(rect, { left: 0, top: 0, width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })
  })
})

describe('clampRect', () => {
  it('pulls boxes back inside the page', () => {
    const rect = clampRect({ x: -0.1, y: 0.9, width: 0.4, height: 0.4 })
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0.9)
    expect(rect.width).toBeCloseTo(0.4)
    // Height is trimmed so the box cannot spill past the page bottom.
    expect(rect.height).toBeCloseTo(0.1)
  })
})

describe('toCssBox', () => {
  it('renders percentages', () => {
    expect(toCssBox({ x: 0.5, y: 0.25, width: 0.5, height: 0.125 })).toEqual({
      left: '50%',
      top: '25%',
      width: '50%',
      height: '12.5%'
    })
  })
})
