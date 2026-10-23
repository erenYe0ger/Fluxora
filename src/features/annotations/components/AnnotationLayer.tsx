import { useState } from 'react'
import type { Annotation } from '../types'
import { toCssBox } from '../lib/geometry'

type Props = {
  annotations: Annotation[]
  onDelete: (id: string) => void
}

/**
 * Read-only overlay: highlights are drawn from normalised rects, notes are pins.
 * Highlights must not capture pointer events, otherwise they block text selection
 * on the layer underneath.
 */
export function AnnotationLayer({ annotations, onDelete }: Props) {
  const [openNote, setOpenNote] = useState<string | null>(null)

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {annotations.map((annotation) => {
        if (annotation.kind === 'highlight') {
          return (
            <div key={annotation.id} aria-hidden>
              {annotation.rects.map((rect, index) => (
                <div
                  key={`${annotation.id}-${index}`}
                  className="annotation-highlight absolute"
                  style={{ ...toCssBox(rect), backgroundColor: annotation.color }}
                />
              ))}
            </div>
          )
        }

        return (
          <div
            key={annotation.id}
            className="animate-pop pointer-events-auto absolute"
            style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%` }}
          >
            <button
              type="button"
              aria-label="Toggle note"
              title={annotation.text}
              className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/80 shadow-md transition duration-150 hover:scale-110"
              style={{ backgroundColor: annotation.color }}
              onClick={() =>
                setOpenNote((current) => (current === annotation.id ? null : annotation.id))
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-black/50" />
            </button>

            {openNote === annotation.id && (
              <div className="animate-pop absolute top-4 left-3 w-56 rounded-xl border border-line bg-surface p-3 text-xs shadow-lift">
                <p className="mb-2 whitespace-pre-wrap text-ink">{annotation.text}</p>
                <button
                  type="button"
                  className="font-medium text-danger transition hover:underline"
                  onClick={() => {
                    onDelete(annotation.id)
                    setOpenNote(null)
                  }}
                >
                  Delete note
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
