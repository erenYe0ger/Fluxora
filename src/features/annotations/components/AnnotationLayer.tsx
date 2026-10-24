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
  onEditText: (id: string, text: string) => void
  /** Double-clicking a text annotation opens the text settings in the right bar. */
  onOpenTextSettings: () => void
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Read-only overlay: highlights are drawn from normalised rects, notes are pins,
 * draws are SVG paths, text is rendered text.
 * Highlights must not capture pointer events, otherwise they block text selection
 * on the layer underneath. Pins drag in select mode only, so the note tool keeps
 * placing new notes instead of grabbing the ones already on the page.
 */
export function AnnotationLayer({
  annotations,
  tool,
  onDelete,
  onMove,
  onEditText,
  onOpenTextSettings
}: Props) {
  const [openNote, setOpenNote] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Focus the edit input whenever editing starts.
  useEffect(() => {
    if (editingId) {
      setEditValue(
        (annotations.find((a) => a.id === editingId && a.kind === 'text') as TextAnnotation | undefined)
          ?.text ?? ''
      )
      requestAnimationFrame(() => editInputRef.current?.select())
    }
  }, [editingId, annotations])

  // Close editing on Escape; save on Enter.
  useEffect(() => {
    if (!editingId) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEditingId(null)
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        onEditText(editingId, editValue.trim() || editValue)
        setEditingId(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editingId, editValue, onEditText])

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
          // thickness is already normalised to the 0-1 viewBox (stored as px / pageWidth at draw time)
          const sw = drawAnnotation.thickness ?? 0.004
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
                  strokeWidth={sw}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          )
        }

        if (annotation.kind === 'text') {
          const textAnnotation = annotation as TextAnnotation
          const isEditing = editingId === annotation.id
          // Clickable in select mode and while the text tool is open, so the editor can
          // still be reached after a double-click switched the tool to text.
          const interactive = tool === 'select' || tool === 'text'
          // fontSize is stored normalised (fraction of page height); multiply by container height
          // so the text renders at the correct size at any zoom level.
          const rootH = rootRef.current?.getBoundingClientRect().height ?? 1
          const renderedFontSize = textAnnotation.fontSize * rootH
          const fontStyle = {
            color: textAnnotation.color,
            fontFamily: textAnnotation.fontFamily,
            fontSize: renderedFontSize,
            fontWeight: textAnnotation.bold ? 'bold' : 'normal',
            fontStyle: textAnnotation.italic ? 'italic' : 'normal',
            textDecoration: textAnnotation.underline ? 'underline' : 'none',
            lineHeight: 1.2
          }
          return (
            <div
              key={annotation.id}
              data-text-annotation={annotation.id}
              className={`absolute group${interactive ? ' pointer-events-auto' : ''}`}
              style={{
                left: `${textAnnotation.x * 100}%`,
                top: `${textAnnotation.y * 100}%`
              }}
            >
              {isEditing ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    onEditText(annotation.id, editValue.trim() || editValue)
                    setEditingId(null)
                  }}
                  className="min-w-[4ch] border-0 bg-transparent outline-none ring-1 ring-accent/60 rounded px-0.5"
                  style={fontStyle}
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditingId(annotation.id)
                    // Double-click also opens the text settings panel in the right bar.
                    onOpenTextSettings()
                  }}
                  className="cursor-text whitespace-pre-wrap"
                  style={fontStyle}
                >
                  {textAnnotation.text}
                </span>
              )}
              {tool === 'select' && !isEditing && (
                <button
                  type="button"
                  aria-label="Delete text"
                  className="absolute -top-2 -right-2 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white opacity-0 transition group-hover:flex group-hover:opacity-100 hover:bg-red-600"
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
            className={`animate-pop absolute${tool === 'select' ? ' pointer-events-auto' : ''}`}
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
