export const MIN_SCALE = 0.25
export const MAX_SCALE = 5
const STEP = 1.2

export function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(scale.toFixed(3))))
}

export function zoomIn(scale: number): number {
  return clampScale(scale * STEP)
}

export function zoomOut(scale: number): number {
  return clampScale(scale / STEP)
}

/**
 * Scale that fits a whole page inside the viewport, keeping `inset` px free on every
 * side. This is a "contain" fit: it grows a small page up and shrinks a large one,
 * never exceeding the available box in either axis.
 */
export function fitPageScale(
  available: { width: number; height: number },
  page: { width: number; height: number },
  inset = 0,
  fallback = 1
): number {
  const boxWidth = available.width - inset * 2
  const boxHeight = available.height - inset * 2
  if (boxWidth <= 0 || boxHeight <= 0 || page.width <= 0 || page.height <= 0) return fallback

  return clampScale(Math.min(boxWidth / page.width, boxHeight / page.height))
}
