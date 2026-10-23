import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type {
  Annotation,
  NoteAnnotation,
  DrawAnnotation,
  TextAnnotation
} from '../types'
import { toCssBox } from '../lib/geometry'
import { NoteIcon } from '@shared/ui/icons'

type Props = {
  annotations: Annotation[]
  tool: 'select' | 'highlight' | 'note' | 'draw' | 'text'
  onDelete: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Read-only overlay: highlights are drawn from normalised rects, notes are pins,
 * draws are SVG paths, text is rendered text.
 * Highlights must not capture pointer events, otherwise they block text selection
 * on the layer underneath. Pins drag in select mode only, so the note tool keeps
 * placing new notes instead of grabbing the ones already on the page.
 */
export function AnnotationLayer({ annotations, tool, onDelete, onMove }: Props) {
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // An open note closes on Escape or on a click anywhere outside it, like any popover.
  useEffect(() => {
    if (!openNote) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest('[data-note-root]')) return
      setOpenNote(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenNote(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openNote])

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, note: NoteAnnotation) => {
    if (tool !== 'select') return
    const root = rootRef.current
    if (!root) return
    event.preventDefault()
    event.stopPropagation()

    const track = (pointer: PointerEvent) => {
      // Re-read the box on every move: the page can scroll under the pointer mid-drag,
      // and stale bounds would push the note outside the page.
      const bounds = root.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return
      const next = {
        id: note.id,
        x: clamp01((pointer.clientX - bounds.left) / bounds.width),
        y: clamp01((pointer.clientY - bounds.top) / bounds.height)
      }
      dragRef.current = next
      setDrag(next)
    }
    const release = () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerup', release)
      const settled = dragRef.current
      dragRef.current = null
      setDrag(null)
      if (settled) onMove(settled.id, settled.x, settled.y)
    }

    window.addEventListener('pointermove', track)
    window.addEventListener('pointerup', release)
  }

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10">
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

        if (annotation.kind === 'draw') {
          const drawAnnotation = annotation as DrawAnnotation
          return (
            <svg
              key={annotation.id}
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              aria-hidden
            >
              {drawAnnotation.paths.map((path, index) => (
                <path
                  key={`${annotation.id}-${index}`}
                  d={path}
                  fill="none"
                  stroke={drawAnnotation.color}
                  strokeWidth={drawAnnotation.thickness * 0.01}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          )
        }

        if (annotation.kind === 'text') {
          const textAnnotation = annotation as TextAnnotation
          return (
            <div
              key={annotation.id}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: `${textAnnotation.x * 100}%`,
                top: `${textAnnotation.y * 100}%`,
                color: textAnnotation.color,
                fontFamily: textAnnotation.fontFamily,
                fontSize: `${textAnnotation.fontSize * 0.01}px`,
                fontWeight: textAnnotation.bold ? 'bold' : 'normal',
                fontStyle: textAnnotation.italic ? 'italic' : 'normal',
                textDecoration: textAnnotation.underline ? 'underline' : 'none'
              }}
            >
              <span className="whitespace-pre-wrap">{textAnnotation.text}</span>
              {tool === 'select' && (
                <button
                  type="button"
                  aria-label="Delete text"
                  className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                  onClick={() => onDelete(annotation.id)}
                >
                  ×
                </button>
              )}
            </div>
          )
        }

        // Note annotation
        const noteAnnotation = annotation as NoteAnnotation
        const position =
          drag && drag.id === annotation.id
            ? { x: drag.x, y: drag.y }
            : { x: noteAnnotation.x, y: noteAnnotation.y }
        const dragging = Boolean(drag && drag.id === annotation.id)
        // Flip the popover towards the inside of the page near the right/bottom edges.
        const openLeft = position.x > 0.62
        const openUp = position.y > 0.62

        return (
          <div
            key={annotation.id}
            data-note-root={annotation.id}
            className="animate-pop pointer-events-auto absolute"
            style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%` }}
          >
            <button
              type="button"
              aria-label="Toggle note"
              title={annotation.text}
              onPointerDown={(event) => startDrag(event, noteAnnotation)}
              className={`flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/85 text-black/60 shadow-md transition duration-150 hover:scale-110 ${
                tool === 'select' ? 'cursor-grab active:cursor-grabbing' : ''
              } ${dragging ? 'scale-110 cursor-grabbing' : ''}`}
              style={{ backgroundColor: annotation.color }}
              onClick={() =>
                setOpenNote((current) => (current === annotation.id ? null : annotation.id))
              }
            >
              <NoteIcon className="h-3 w-3" />
            </button>

            {openNote === annotation.id && (
              <div
                className={`animate-pop absolute w-56 rounded-xl border border-line bg-surface p-3 text-xs shadow-lift ${
                  openLeft ? 'right-3' : 'left-3'
                } ${openUp ? 'bottom-4' : 'top-4'}`}
              >
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
