/**
 * Cursor for the highlight tool: a highlighter glyph tinted with the colour that is
 * about to be applied, so the pointer shows the outcome before the drag.
 * The hotspot sits on the nib (bottom-left).
 */
export function markerCursor(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26">` +
    `<path d="M3 23.5h7" stroke="#111" stroke-width="2" stroke-linecap="round" opacity=".75"/>` +
    `<path d="M5.5 20.5 2.8 17.8 15.6 5l5.4 5.4z" fill="${color}" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="m16.6 6 5.4 5.4 1.8-1.8a1.9 1.9 0 0 0 0-2.7l-2.7-2.7a1.9 1.9 0 0 0-2.7 0z" fill="#111" opacity=".55"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 3 22, crosshair`
}

/** Dark or light ink, whichever stays visible on the given swatch colour. */
export function contrastInk(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!match) return '#0a0c11'
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? '#0a0c11' : '#ffffff'
}
