import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePageRender } from '../hooks/usePageRender'
import { useTextLayer } from '../hooks/useTextLayer'
import { useSearchRects } from '../hooks/useSearchRects'
import { markerCursor, selectCursor } from '../lib/cursor'
import { useInView } from '@shared/hooks/useInView'
import type { Tool } from '../store/viewerStore'
import type { Annotation, Rect } from '@features/annotations'
import { clampRect, normalizeRect, toCssBox } from '@features/annotations'
import { AnnotationLayer } from '@features/annotations'

type Props = {
  page: PDFPageProxy
  scale: number
  tool: Tool
  annotations: Annotation[]
  searchQuery: string
  activeMatch: number | null
  /** Drives the marker cursor so the pointer shows the colour about to be applied. */
  highlightColor: string
  onHighlight: (input: { rects: Rect[]; text: string }) => void
  onNote: (input: { x: number; y: number; text: string }) => void
  onDeleteAnnotation: (id: string) => void
  onMoveAnnotation: (id: string, x: number, y: number) => void
}

/** Composer size in px; used to keep the box inside the page near the right/bottom edge. */
const NOTE_BOX_WIDTH = 240
const NOTE_BOX_HEIGHT = 152
const EDGE_MARGIN = 8

const DOUBLE_CLICK_MS = 350
const DOUBLE_CLICK_SLOP = 8

/**
 * One PDF page: canvas + text layer + annotation overlay.
 * Canvas work is deferred until the page approaches the viewport.
 */
export function PdfPageView({
  page,
  scale,
  tool,
  annotations,
  searchQuery,
  activeMatch,
  highlightColor,
  onHighlight,
  onNote,
  onDeleteAnnotation,
  onMoveAnnotation
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapperRef)

  const viewport = page.getViewport({ scale })
  // Both effects key off `inView`: the canvas/text layer mount only once the page
  // approaches the viewport, so the refs must be part of the dependency chain.
  usePageRender({ page, scale, canvasRef, enabled: inView })
  const textVersion = useTextLayer({ page, scale, containerRef: textLayerRef, enabled: inView })
  const searchRects = useSearchRects({
    pageElement: wrapperRef.current,
    textLayerElement: textLayerRef.current,
    query: searchQuery,
    textVersion,
    scale
  })

  const [draftNote, setDraftNote] = useState<{ x: number; y: number; text: string } | null>(null)
  // Distinguishes "select again" from "remove this highlight" without relying on the
  // dblclick event, which would arrive after we already created a duplicate.
  const lastClickRef = useRef<{ time: number; x: number; y: number } | null>(null)

  const pageAnnotations = annotations.filter((annotation) => annotation.page === page.pageNumber)

  const highlightAt = (nx: number, ny: number) => {
    for (let index = pageAnnotations.length - 1; index >= 0; index -= 1) {
      const annotation = pageAnnotations[index]
      if (annotation.kind !== 'highlight') continue
      const hit = annotation.rects.some(
        (rect) =>
          nx >= rect.x && nx <= rect.x + rect.width && ny >= rect.y && ny <= rect.y + rect.height
      )
      if (hit) return annotation
    }
    return null
  }

  // Selection -> highlight. getClientRects gives one box per visual line, which we
  // normalise against the page box so the highlight is zoom-independent.
  const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (tool !== 'highlight' || !wrapperRef.current) return
    const pageBox = wrapperRef.current.getBoundingClientRect()

    const now = Date.now()
    const previous = lastClickRef.current
    const isSecondClick =
      previous !== null &&
      now - previous.time < DOUBLE_CLICK_MS &&
      Math.abs(event.clientX - previous.x) < DOUBLE_CLICK_SLOP &&
      Math.abs(event.clientY - previous.y) < DOUBLE_CLICK_SLOP
    lastClickRef.current = { time: now, x: event.clientX, y: event.clientY }

    const selection = window.getSelection()
    const nx = (event.clientX - pageBox.left) / pageBox.width
    const ny = (event.clientY - pageBox.top) / pageBox.height

    if (isSecondClick) {
      const hit = highlightAt(nx, ny)
      if (hit) onDeleteAnnotation(hit.id)
      selection?.removeAllRanges()
      return
    }

    if (!selection || selection.isCollapsed || !textLayerRef.current) return
    if (!textLayerRef.current.contains(selection.anchorNode)) return

    const text = selection.toString().trim()
    const rects = Array.from(selection.getRangeAt(0).getClientRects())
      .filter((rect) => rect.width > 1 && rect.height > 1)
      .map((rect) => clampRect(normalizeRect(rect, pageBox)))

    if (text && rects.length > 0) onHighlight({ rects, text })
    selection.removeAllRanges()
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (tool !== 'note' || !wrapperRef.current) return
    const pageBox = wrapperRef.current.getBoundingClientRect()
    setDraftNote({
      x: (event.clientX - pageBox.left) / pageBox.width,
      y: (event.clientY - pageBox.top) / pageBox.height,
      text: ''
    })
  }

  // Keep the composer fully inside the page: open down-right from the cursor when there is
  // room, otherwise slide it back so no part of the box is clipped away.
  const composerPosition = (() => {
    if (!draftNote) return null
    const maxLeft = Math.max(EDGE_MARGIN, viewport.width - NOTE_BOX_WIDTH - EDGE_MARGIN)
    const maxTop = Math.max(EDGE_MARGIN, viewport.height - NOTE_BOX_HEIGHT - EDGE_MARGIN)
    return {
      left: Math.min(Math.max(draftNote.x * viewport.width, EDGE_MARGIN), maxLeft),
      top: Math.min(Math.max(draftNote.y * viewport.height, EDGE_MARGIN), maxTop),
      width: Math.min(NOTE_BOX_WIDTH, viewport.width - EDGE_MARGIN * 2)
    }
  })()

  return (
    <div
      id={`page-${page.pageNumber}`}
      ref={wrapperRef}
      data-page={page.pageNumber}
      data-tool={tool}
      className="relative mx-auto w-fit shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-black/10"
      style={{
        width: viewport.width,
        height: viewport.height,
        boxShadow: 'var(--page-shadow)',
        cursor:
          tool === 'note'
            ? 'crosshair'
            : tool === 'highlight'
              ? markerCursor(highlightColor)
              : selectCursor()
      }}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {inView ? (
        <>
          <canvas ref={canvasRef} className="animate-fade-in block" />
          <div ref={textLayerRef} className="textLayer" />
          <AnnotationLayer
            annotations={pageAnnotations}
            tool={tool}
            onDelete={onDeleteAnnotation}
            onMove={onMoveAnnotation}
          />

          {searchRects.map((rects, index) =>
            rects.map((rect, rectIndex) => (
              <div
                key={`${index}-${rectIndex}`}
                className="search-hit pointer-events-none absolute z-20"
                data-active={activeMatch === index}
                style={toCssBox(rect)}
              />
            ))
          )}
        </>
      ) : (
        <div className="flex h-full items-center justify-center">
          <span className="animate-pulse text-xs text-slate-400">Page {page.pageNumber}</span>
        </div>
      )}

      {draftNote && composerPosition && (
        <div
          className="animate-pop absolute z-30 rounded-xl border border-line bg-surface p-2.5 text-xs shadow-lift"
          style={{ left: composerPosition.left, top: composerPosition.top, width: composerPosition.width }}
          onClick={(event) => event.stopPropagation()}
        >
          <textarea
            autoFocus
            rows={3}
            placeholder="Write a note…"
            className="w-full resize-none rounded-lg border border-line bg-surface-2 p-2 text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            value={draftNote.text}
            onChange={(event) => setDraftNote({ ...draftNote, text: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setDraftNote(null)
            }}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-danger transition hover:bg-danger-soft"
              onClick={() => setDraftNote(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-accent px-2.5 py-1 font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-45"
              disabled={!draftNote.text.trim()}
              onClick={() => {
                onNote({ x: draftNote.x, y: draftNote.y, text: draftNote.text.trim() })
                setDraftNote(null)
              }}
            >
              Save note
            </button>
          </div>
        </div>
      )}
    </div>
  )
}



