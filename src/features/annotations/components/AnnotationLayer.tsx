import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type {
  Annotation,
  NoteAnnotation,
  DrawAnnotation,
  TextAnnotation
} from '../types'
import type { TextAnnotationPatch } from '../hooks/useAnnotations'
import { toCssBox } from '../lib/geometry'
import { NoteIcon } from '@shared/ui/icons'
import { ColorPicker } from '@shared/ui/ColorPicker'
import { DRAW_PRESETS, useSettingsStore } from '@features/settings'

type Props = {
  annotations: Annotation[]
  tool: 'select' | 'highlight' | 'note' | 'draw' | 'text'
  onDelete: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onUpdateText: (id: string, patch: TextAnnotationPatch) => void
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
  onUpdateText
}: Props) {
  const [openNote, setOpenNote] = useState<string | null>(null)
  /** The text annotation whose popover is currently open. */
  const [openTextId, setOpenTextId] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; x: number; y: number } | null>(null)
  const dragRef = useRef<{ id: string; x: number; y: number } | null>(null)
  const hasDraggedRef = useRef(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Editing mode for text is only available in select mode; close when tool changes
  useEffect(() => {
    if (tool !== 'select') {
      setOpenTextId(null)
      setOpenNote(null)
    }
  }, [tool])

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

  // Close text popover on Escape or outside click (ignoring clicks inside ColorPicker portal).
  useEffect(() => {
    if (!openTextId) return
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest('[data-text-popover]')) return
      if (target?.closest(`[data-text-annotation="${openTextId}"]`)) return
      if (target?.closest('[data-color-picker-portal]')) return
      setOpenTextId(null)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenTextId(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [openTextId])

  const startDrag = (
    event: ReactPointerEvent<HTMLElement>,
    item: { id: string; x: number; y: number }
  ) => {
    if (tool !== 'select') return
    const root = rootRef.current
    if (!root) return
    event.preventDefault()
    event.stopPropagation()

    hasDraggedRef.current = false
    const startX = event.clientX
    const startY = event.clientY

    const track = (pointer: PointerEvent) => {
      if (
        !hasDraggedRef.current &&
        (Math.abs(pointer.clientX - startX) > 3 || Math.abs(pointer.clientY - startY) > 3)
      ) {
        hasDraggedRef.current = true
      }
      const bounds = root.getBoundingClientRect()
      if (bounds.width === 0 || bounds.height === 0) return
      const next = {
        id: item.id,
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
      if (settled && hasDraggedRef.current) {
        onMove(settled.id, settled.x, settled.y)
      }
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 50)
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
          const isSelect = tool === 'select'
          const isOpen = openTextId === annotation.id
          // fontSize is stored normalised (fraction of page height); multiply by container height
          // so the text renders at the correct size at any zoom level.
          const rootH = rootRef.current?.getBoundingClientRect().height ?? 1
          const renderedFontSize = textAnnotation.fontSize * rootH
          const fontStyle = {
            color: textAnnotation.color,
            fontFamily: textAnnotation.fontFamily,
            fontSize: renderedFontSize,
            fontWeight: textAnnotation.bold ? 'bold' : ('normal' as const),
            fontStyle: textAnnotation.italic ? 'italic' : ('normal' as const),
            textDecoration: textAnnotation.underline ? 'underline' : ('none' as const),
            lineHeight: 1.25
          }

          const position =
            drag && drag.id === annotation.id
              ? { x: drag.x, y: drag.y }
              : { x: textAnnotation.x, y: textAnnotation.y }
          const dragging = Boolean(drag && drag.id === annotation.id)

          // Flip the popover towards the inside of the page near the right/bottom edges.
          const openLeft = position.x > 0.5
          const openUp = position.y > 0.6

          return (
            <div
              key={annotation.id}
              data-text-annotation={annotation.id}
              className={`absolute group${isSelect ? ' pointer-events-auto' : ''}`}
              style={{
                left: `${position.x * 100}%`,
                top: `${position.y * 100}%`,
                maxWidth: `calc(100% - ${position.x * 100}%)`,
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              <span
                onPointerDown={(event) =>
                  startDrag(event, { id: annotation.id, x: position.x, y: position.y })
                }
                onClick={(e) => {
                  e.stopPropagation()
                  // Editing window is only available in select mode; clicking in text mode does not open it
                  if (!isSelect || hasDraggedRef.current) return
                  setOpenTextId((current) =>
                    current === annotation.id ? null : annotation.id
                  )
                }}
                className={`inline-block whitespace-pre-wrap break-words rounded px-0.5 transition-all ${
                  isSelect ? 'cursor-grab active:cursor-grabbing' : ''
                } ${dragging ? 'cursor-grabbing select-none' : ''} ${
                  isOpen
                    ? 'ring-2 ring-accent/60'
                    : isSelect
                      ? 'hover:ring-1 hover:ring-accent/30'
                      : ''
                }`}
                style={{
                  ...fontStyle,
                  maxWidth: '100%',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {textAnnotation.text}
              </span>

              {/* Note-style popover for editing text content and style */}
              {isOpen && isSelect && (
                <TextAnnotationPopover
                  annotation={textAnnotation}
                  openLeft={openLeft}
                  openUp={openUp}
                  renderedFontSize={renderedFontSize}
                  pageHeight={rootH}
                  onUpdate={(patch) => onUpdateText(annotation.id, patch)}
                  onDelete={() => {
                    onDelete(annotation.id)
                    setOpenTextId(null)
                  }}
                  onClose={() => setOpenTextId(null)}
                />
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

// ── Text annotation popover ───────────────────────────────────────────────────
// Mirrors the notes popover aesthetic: rounded card, shadow, animate-pop.
// Provides inline controls for text content, colour, size, and B/I/U toggles.

type TextPopoverProps = {
  annotation: TextAnnotation
  openLeft: boolean
  openUp: boolean
  renderedFontSize: number
  pageHeight: number
  onUpdate: (patch: TextAnnotationPatch) => void
  onDelete: () => void
  onClose: () => void
}

function TextAnnotationPopover({
  annotation,
  openLeft,
  openUp,
  pageHeight,
  onUpdate,
  onDelete,
  onClose
}: TextPopoverProps) {
  // Keep draft changes local so clicking Cancel nullifies all edits
  const [draftText, setDraftText] = useState(annotation.text)
  const [draftColor, setDraftColor] = useState(annotation.color)
  const [draftFontSize, setDraftFontSize] = useState(annotation.fontSize)
  const [draftBold, setDraftBold] = useState(annotation.bold)
  const [draftItalic, setDraftItalic] = useState(annotation.italic)
  const [draftUnderline, setDraftUnderline] = useState(annotation.underline)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const customTextColor = useSettingsStore((s) => s.customTextColor)
  const setCustomTextColor = useSettingsStore((s) => s.setCustomTextColor)
  const displaySize = Math.round(draftFontSize * pageHeight)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.select())
  }, [])

  const handleEdit = () => {
    const trimmed = draftText.trim()
    if (trimmed) {
      onUpdate({
        text: trimmed,
        color: draftColor,
        fontSize: draftFontSize,
        bold: draftBold,
        italic: draftItalic,
        underline: draftUnderline
      })
    }
    onClose()
  }

  return (
    <div
      data-text-popover
      className={`animate-pop absolute z-30 w-64 rounded-xl border border-line bg-surface p-2.5 text-xs shadow-lift ${
        openLeft ? 'right-0' : 'left-0'
      } ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Editable text content: plain unstyled while typing so it never shows bold/underline */}
      <textarea
        ref={inputRef}
        rows={3}
        placeholder="Type here…"
        className="w-full resize-none rounded-lg border border-line bg-surface-2 p-2 font-normal text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
        style={{
          fontFamily: annotation.fontFamily,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none'
        }}
        value={draftText}
        onChange={(e) => setDraftText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose()
          // Enter key enters a new line in the text naturally; no auto-submit
        }}
      />

      {/* ── Colour picker with presets + custom color ───────── */}
      <div className="mt-2 flex flex-col gap-1">
        <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Colour</p>
        <ColorPicker
          label="Text"
          presets={DRAW_PRESETS}
          value={draftColor}
          customColor={customTextColor}
          onChange={(color) => setDraftColor(color)}
          onCustomColor={(color) => {
            setCustomTextColor(color)
            setDraftColor(color)
          }}
        />
      </div>

      {/* ── Font size ───────────────────────────────────────── */}
      <div className="mt-2 flex flex-col gap-1">
        <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Size</p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const newPx = Math.max(8, displaySize - 2)
              setDraftFontSize(newPx / pageHeight)
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
            aria-label="Decrease size"
          >
            −
          </button>
          <span className="flex-1 text-center text-xs font-medium tabular-nums text-ink">
            {displaySize}px
          </span>
          <button
            type="button"
            onClick={() => {
              const newPx = Math.min(72, displaySize + 2)
              setDraftFontSize(newPx / pageHeight)
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
            aria-label="Increase size"
          >
            +
          </button>
        </div>
      </div>

      {/* ── Style toggles (B / I / U) ──────────────────────── */}
      <div className="mt-2 flex flex-col gap-1">
        <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Style</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setDraftBold(!draftBold)}
            aria-pressed={draftBold}
            aria-label="Bold"
            className={`flex h-7 flex-1 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
              draftBold
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line text-muted hover:border-line-strong hover:text-ink'
            }`}
          >
            B
          </button>
          <button
            type="button"
            onClick={() => setDraftItalic(!draftItalic)}
            aria-pressed={draftItalic}
            aria-label="Italic"
            className={`flex h-7 flex-1 items-center justify-center rounded-lg border text-sm italic transition-all ${
              draftItalic
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line text-muted hover:border-line-strong hover:text-ink'
            }`}
          >
            I
          </button>
          <button
            type="button"
            onClick={() => setDraftUnderline(!draftUnderline)}
            aria-pressed={draftUnderline}
            aria-label="Underline"
            className={`flex h-7 flex-1 items-center justify-center rounded-lg border text-sm underline transition-all ${
              draftUnderline
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line text-muted hover:border-line-strong hover:text-ink'
            }`}
          >
            U
          </button>
        </div>
      </div>

      {/* ── Footer: delete on left, cancel and edit on right ── */}
      <div className="mt-2.5 flex items-center justify-between border-t border-line pt-2">
        <button
          type="button"
          className="font-medium text-danger transition hover:underline"
          onClick={onDelete}
        >
          Delete
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rounded-md px-2 py-1 text-xs text-muted transition hover:bg-surface-2 hover:text-ink"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-45"
            disabled={!draftText.trim()}
            onClick={handleEdit}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}