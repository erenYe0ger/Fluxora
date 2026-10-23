export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type HighlightAnnotation = {
  id: string
  docId: string
  page: number
  kind: 'highlight'
  color: string
  /** Page-relative (0..1) boxes so highlights survive zoom and re-render. */
  rects: Rect[]
  text: string
  createdAt: number
}

export type NoteAnnotation = {
  id: string
  docId: string
  page: number
  kind: 'note'
  color: string
  /** Page-relative (0..1) anchor point. */
  x: number
  y: number
  text: string
  createdAt: number
}

export type Annotation = HighlightAnnotation | NoteAnnotation

export const HIGHLIGHT_COLORS = {
  yellow: '#fde047',
  green: '#86efac',
  blue: '#93c5fd',
  pink: '#f9a8d4'
} as const

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS
