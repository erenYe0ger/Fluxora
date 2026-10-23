/**
 * Tiny HSV/hex helpers for the in-panel colour picker. Hue is kept as state rather than
 * derived from the hex, so dragging to black does not lose the hue the user started from.
 */

export type Hsv = { h: number; s: number; v: number }

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

export function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!match) return null
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16))
  return { r, g, b }
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = (((h % 360) + 360) % 360) / 60
  const saturation = clamp01(s)
  const value = clamp01(v)
  const chroma = value * saturation
  const second = chroma * (1 - Math.abs((hue % 2) - 1))
  const offset = value - chroma

  const [r, g, b] =
    hue < 1
      ? [chroma, second, 0]
      : hue < 2
        ? [second, chroma, 0]
        : hue < 3
          ? [0, chroma, second]
          : hue < 4
            ? [0, second, chroma]
            : hue < 5
              ? [second, 0, chroma]
              : [chroma, 0, second]

  const channel = (n: number) =>
    Math.round((n + offset) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`
}

export function hexToHsv(hex: string): Hsv {
  const rgb = parseHex(hex)
  if (!rgb) return { h: 0, s: 0, v: 0 }
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6)
    else if (max === g) h = 60 * ((b - r) / delta + 2)
    else h = 60 * ((r - g) / delta + 4)
  }
  if (h < 0) h += 360

  return { h, s: max === 0 ? 0 : delta / max, v: max }
}

/** Solid hue ring used as the picker's default face. */
export const RAINBOW =
  'conic-gradient(#ff6b6b, #ffd166, #8ce7a8, #7cc7ff, #b79bff, #ff8ad8, #ff6b6b)'
