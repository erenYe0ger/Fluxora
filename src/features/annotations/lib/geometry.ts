import type { Rect } from '../types'

/** Convert a DOM rect (viewport coordinates) into page-relative 0..1 space. */
export function normalizeRect(
  rect: { left: number; top: number; width: number; height: number },
  page: { left: number; top: number; width: number; height: number }
): Rect {
  if (page.width === 0 || page.height === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  return {
    x: (rect.left - page.left) / page.width,
    y: (rect.top - page.top) / page.height,
    width: rect.width / page.width,
    height: rect.height / page.height
  }
}

/** Guard against float noise and off-page values coming from browser selections. */
export function clampRect(rect: Rect): Rect {
  const x = clamp01(rect.x)
  const y = clamp01(rect.y)
  return {
    x,
    y,
    width: Math.min(clamp01(rect.width), 1 - x),
    height: Math.min(clamp01(rect.height), 1 - y)
  }
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** CSS box for rendering a normalised rect over the page. */
export function toCssBox(rect: Rect): { left: string; top: string; width: string; height: string } {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`
  }
}
