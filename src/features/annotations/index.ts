// Public surface of the annotations feature. Other features import from here,
// never from the files inside it.
export type {
  Annotation,
  HighlightAnnotation,
  NoteAnnotation,
  HighlightColor,
  Rect
} from './types'
export { HIGHLIGHT_COLORS } from './types'
export { clampRect, normalizeRect, toCssBox } from './lib/geometry'
export { useAnnotations } from './hooks/useAnnotations'
export { AnnotationLayer } from './components/AnnotationLayer'
export { AnnotationsPanel } from './components/AnnotationsPanel'
