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
 * Scale that makes a page fill the available width (minus gutters).
 * Returns the current scale when dimensions are not known yet.
 */
export function fitWidthScale(
  containerWidth: number,
  pageWidth: number,
  gutter = 48,
  fallback = 1
): number {
  if (containerWidth <= 0 || pageWidth <= 0) return fallback
  const available = containerWidth - gutter
  if (available <= 0) return fallback
  return clampScale(available / pageWidth)
}
