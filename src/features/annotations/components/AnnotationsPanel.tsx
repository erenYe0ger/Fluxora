import type { Annotation, HighlightAnnotation, NoteAnnotation, TextAnnotation, DrawAnnotation } from '../types'
import { previewText } from '../lib/preview'
import { HighlighterIcon, NoteIcon, PencilIcon, TextIcon, CloseIcon } from '@shared/ui/icons'

type Props = {
  annotations: Annotation[]
  onJump: (page: number) => void
  onDelete: (id: string) => void
}

const getAnnotationLabel = (annotation: Annotation): string => {
  switch (annotation.kind) {
    case 'note': return 'Note'
    case 'draw': return 'Draw'
    case 'text': return 'Text'
    case 'highlight':
    default:
      return 'Highlight'
  }
}

const getAnnotationText = (annotation: Annotation): string => {
  switch (annotation.kind) {
    case 'note':
    case 'highlight':
      return (annotation as HighlightAnnotation | NoteAnnotation).text
    case 'text':
      return (annotation as TextAnnotation).text
    case 'draw': {
      const draw = annotation as DrawAnnotation
      return `Drawing (${draw.paths.length} stroke${draw.paths.length !== 1 ? 's' : ''})`
    }
    default:
      return ''
  }
}

export function AnnotationsPanel({ annotations, onJump, onDelete }: Props) {
  if (annotations.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center gap-2 px-4 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted">
          <HighlighterIcon className="h-5 w-5" />
        </span>
        <p className="text-xs font-medium text-ink">Nothing marked yet</p>
        <p className="text-[11px] leading-relaxed text-muted">
          Pick the highlight tool and select text, or drop a note anywhere on the page.
        </p>
      </div>
    )
  }

  return (
    <ul className="space-y-1.5 p-2">
      {annotations.map((annotation, index) => (
        <li
          key={annotation.id}
          className="animate-fade-up group rounded-lg border border-transparent transition duration-150 hover:border-line hover:bg-surface-2"
          style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
        >
          <div className="flex items-start gap-2 p-2">
            <span
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-black/10 text-black/50"
              style={{ backgroundColor: annotation.color }}
            >
              {annotation.kind === 'note' ? (
                <NoteIcon className="h-3 w-3" />
              ) : annotation.kind === 'draw' ? (
                <PencilIcon className="h-3 w-3" />
              ) : annotation.kind === 'text' ? (
                <TextIcon className="h-3 w-3" />
              ) : (
                <HighlighterIcon className="h-3 w-3" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => onJump(annotation.page)}
                title={getAnnotationText(annotation)}
              >
                <span className="text-[11px] font-medium text-muted">
                  Page {annotation.page} · {getAnnotationLabel(annotation)}
                </span>
                <p className="mt-0.5 text-xs leading-snug break-words text-ink">
                  {previewText(getAnnotationText(annotation))}
                </p>
              </button>
            </div>

            <button
              type="button"
              aria-label="Delete annotation"
              className="rounded-md p-1 text-muted opacity-0 transition duration-150 group-hover:opacity-100 hover:bg-danger-soft hover:text-danger focus-visible:opacity-100"
              onClick={() => onDelete(annotation.id)}
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}