import { useState } from 'react'
import type { Annotation } from '../types'
import { toCssBox } from '../lib/geometry'

type Props = {
  annotations: Annotation[]
  onDelete: (id: string) => void
}

/**
 * Read-only overlay: highlights are derived from normalised rects, notes are pins.
 * Interaction (creating) lives in PdfPageView because it needs the selection.
 */
export function AnnotationLayer({ annotations, onDelete }: Props) {
  const [openNote, setOpenNote] = useState<string | null>(null)

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {annotations.map((annotation) => {
        if (annotation.kind === 'highlight') {
          return (
            <div key={annotation.id}>
              {annotation.rects.map((rect, index) => (
                <div
                  key={`${annotation.id}-${index}`}
                  className="annotation-highlight pointer-events-auto absolute cursor-pointer"
                  style={{ ...toCssBox(rect), backgroundColor: annotation.color }}
                  title={annotation.text}
                  onDoubleClick={() => onDelete(annotation.id)}
                />
              ))}
            </div>
          )
        }

        return (
          <div
            key={annotation.id}
            className="pointer-events-auto absolute"
            style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%` }}
          >
            <button
              type="button"
              aria-label="Toggle note"
              className="flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-amber-500 bg-amber-300 text-xs shadow"
              onClick={() => setOpenNote((current) => (current === annotation.id ? null : annotation.id))}
            >
              ✎
            </button>
            {openNote === annotation.id && (
              <div className="absolute left-4 top-0 w-48 rounded border border-slate-300 bg-white p-2 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-800">
                <p className="mb-2 whitespace-pre-wrap">{annotation.text}</p>
                <button
                  type="button"
                  className="text-red-600 hover:underline"
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
