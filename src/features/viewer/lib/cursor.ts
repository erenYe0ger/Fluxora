/**
 * Mouse cursors that mirror the toolbar icons.
 *
 * Both are inline SVG data URIs so there are no image assets to keep in sync: the paths are
 * copied from `shared/ui/icons.tsx` and the hotspot sits on the part of the glyph that should
 * land on the pointer (the nib of the marker, the tip of the arrow).
 */

const GLYPH = 'm14 4 6 6-8.2 8.2H6.2v-5.6z'
const UNDERLINE = 'M4 21h9'

/** Solid marker in the active highlight colour, outlined in black so it reads on any page. */
export function markerCursor(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
    `<path d="${GLYPH}" fill="${color}" stroke="#000" stroke-width="1.7" stroke-linejoin="round"/>` +
    `<path d="${UNDERLINE}" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 6 19, crosshair`
}

/** The toolbar's cursor arrow (filled, with a light halo) for select mode. */
export function selectCursor(): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
    `<path d="m5.5 3.5 6.4 16.4 2.2-6.2 6.4-2.2z" fill="#0a0c11" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 5 3, default`
}

/** Pencil cursor for draw mode. */
export function pencilCursor(color: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">` +
    `<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" fill="${color}" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>` +
    `<path d="m15 5 4 4" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 17 3, crosshair`
}

/** Text cursor: clean serif "T" glyph, matches TextIcon. */
export function textCursor(): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">` +
    `<path d="M11 4h4" stroke="#0a0c11" stroke-width="2" stroke-linecap="round"/>` +
    `<path d="M13 4v20" stroke="#0a0c11" stroke-width="2" stroke-linecap="round"/>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, text`
}
