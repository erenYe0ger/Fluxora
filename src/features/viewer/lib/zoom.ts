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
 * Reading scale: the page fills the available width, minus `inset` px on each side so
 * text never runs into the viewport edge. Vertical overflow simply scrolls.
 */
export function fitWidthScale(
  containerWidth: number,
  pageWidth: number,
  inset = 0,
  fallback = 1
): number {
  const available = containerWidth - inset * 2
  if (available <= 0 || pageWidth <= 0) return fallback
  return clampScale(available / pageWidth)
}
