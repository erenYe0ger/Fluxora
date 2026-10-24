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

export type DrawAnnotation = {
  id: string
  docId: string
  page: number
  kind: 'draw'
  color: string
  thickness: number
  /** SVG path data - page-relative coordinates (0..1 scale). */
  paths: string[]
  createdAt: number
}

export type TextAnnotation = {
  id: string
  docId: string
  page: number
  kind: 'text'
  color: string
  fontFamily: string
  fontSize: number
  bold: boolean
  italic: boolean
  underline: boolean
  /** Page-relative (0..1) anchor point. */
  x: number
  y: number
  text: string
  createdAt: number
}

export type Annotation = HighlightAnnotation | NoteAnnotation | DrawAnnotation | TextAnnotation
