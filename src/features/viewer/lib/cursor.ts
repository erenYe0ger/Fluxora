/**
 * Cursor for the highlight tool. It is the same glyph as the toolbar's HighlighterIcon,
 * stroked in the colour that is about to be applied, with a soft dark halo so a light
 * colour stays visible on a white page. The hotspot sits on the nib.
 */
export function markerCursor(color: string): string {
  const glyph = 'm14 4 6 6-8.2 8.2H6.2v-5.6z'
  const underline = 'M4 21h9'
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    // Halo first, then the tinted glyph on top.
    `<g stroke="#111" stroke-opacity=".45" stroke-width="4"><path d="${glyph}"/><path d="${underline}"/></g>` +
    `<g stroke="${color}" stroke-width="1.9"><path d="${glyph}"/><path d="${underline}"/></g>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 5 20, crosshair`
}

/** Dark or light ink, whichever stays visible on the given swatch colour. */
export function contrastInk(hex: string): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!match) return '#0a0c11'
  const [r, g, b] = match.slice(1).map((part) => parseInt(part, 16) / 255)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 0.55 ? '#0a0c11' : '#ffffff'
}
