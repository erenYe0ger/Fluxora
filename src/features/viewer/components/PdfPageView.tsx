import { useRef, useState, useEffect } from 'react'
import type { MouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePageRender } from '../hooks/usePageRender'
import { useTextLayer } from '../hooks/useTextLayer'
import { useSearchRects } from '../hooks/useSearchRects'
import { markerCursor, selectCursor, pencilCursor, textCursor } from '../lib/cursor'
import { useInView } from '@shared/hooks/useInView'
import { useViewerStore } from '../store/viewerStore'
import type { Tool } from '../store/viewerStore'
import type { Annotation, Rect, TextAnnotationPatch } from '@features/annotations'
import { clampRect, normalizeRect, toCssBox } from '@features/annotations'
import { AnnotationLayer } from '@features/annotations'
import { DRAW_PRESETS, useSettingsStore } from '@features/settings'
import { ColorPicker } from './ColorPicker'

type Props = {
  page: PDFPageProxy
  scale: number
  tool: Tool
  annotations: Annotation[]
  searchQuery: string
  activeMatch: number | null
  /** Drives the marker cursor so the pointer shows the colour about to be applied. */
  highlightColor: string
  /** Drives the pencil cursor colour. */
  drawColor: string
  /** Drawing line thickness. */
  drawThickness: number
  /** Drives the text cursor colour. */
  textColor: string
  textFontFamily: string
  textFontSize: number
  textBold: boolean
  textItalic: boolean
  textUnderline: boolean
  onHighlight: (input: { rects: Rect[]; text: string }) => void
  onNote: (input: { x: number; y: number; text: string }) => void
  onDraw: (input: { paths: string[]; color: string; thickness: number }) => void
  onText: (input: {
    x: number
    y: number
    text: string
    color: string
    fontFamily: string
    fontSize: number
    bold: boolean
    italic: boolean
    underline: boolean
  }) => void
  onDeleteAnnotation: (id: string) => void
  onMoveAnnotation: (id: string, x: number, y: number) => void
  onUpdateText: (id: string, patch: TextAnnotationPatch) => void
}

/** Composer size in px; used to keep the box inside the page near the right/bottom edge. */
const NOTE_BOX_WIDTH = 240
const NOTE_BOX_HEIGHT = 152
const TEXT_BOX_WIDTH = 264
const TEXT_BOX_HEIGHT = 280
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
  drawColor,
  drawThickness,
  textColor,
  textFontFamily,
  textFontSize,
  textBold,
  textItalic,
  textUnderline,
  onHighlight,
  onNote,
  onDraw,
  onText,
  onDeleteAnnotation,
  onMoveAnnotation,
  onUpdateText
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const textLayerRef = useRef<HTMLDivElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const inView = useInView(wrapperRef)

  const customTextColor = useSettingsStore((state) => state.customTextColor)
  const setCustomTextColor = useSettingsStore((state) => state.setCustomTextColor)

  // Use refs for drawing state to avoid closure issues
  const drawingRef = useRef<{
    isDrawing: boolean
    path: { x: number; y: number }[]
    color: string
    thickness: number
  }>({ isDrawing: false, path: [], color: drawColor, thickness: drawThickness })

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
  const [draftText, setDraftText] = useState<{
    x: number
    y: number
    text: string
    color: string
    fontFamily: string
    fontSize: number
    bold: boolean
    italic: boolean
    underline: boolean
  } | null>(null)
  const [, setForceRender] = useState(0)

  // Distinguishes "select again" from "remove this highlight" without relying on the
  // dblclick event, which would arrive after we already created a duplicate.
  const lastClickRef = useRef<{ time: number; x: number; y: number } | null>(null)

  // Sync drawing settings with ref
  useEffect(() => {
    drawingRef.current.color = drawColor
    drawingRef.current.thickness = drawThickness
  }, [drawColor, drawThickness])

  // Real-time draw canvas rendering
  useEffect(() => {
    if (tool !== 'draw' || !drawCanvasRef.current || !wrapperRef.current) return
    const canvas = drawCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const drawing = drawingRef.current
      if (drawing.isDrawing && drawing.path.length > 0) {
        const bounds = wrapperRef.current!.getBoundingClientRect()
        const w = bounds.width
        const h = bounds.height
        ctx.strokeStyle = drawing.color
        // Live preview: thickness is in CSS pixels (slider 1–20 = 1–20 px).
        ctx.lineWidth = drawing.thickness
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        drawing.path.forEach((point, index) => {
          const px = point.x * w
          const py = point.y * h
          if (index === 0) {
            ctx.moveTo(px, py)
          } else {
            ctx.lineTo(px, py)
          }
        })
        ctx.stroke()
      }
    }

    // Re-render on state change for drawing
    const interval = setInterval(render, 16)
    return () => clearInterval(interval)
  }, [tool])

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

  // Read tool from the store directly to avoid stale closures during React 18's event batching.
  const handleMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (useViewerStore.getState().tool !== 'highlight' || !wrapperRef.current) return
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
    if (!wrapperRef.current) return
    const pageBox = wrapperRef.current.getBoundingClientRect()
    const currentTool = useViewerStore.getState().tool

    if (currentTool === 'note') {
      setDraftNote({
        x: (event.clientX - pageBox.left) / pageBox.width,
        y: (event.clientY - pageBox.top) / pageBox.height,
        text: ''
      })
    }

    if (currentTool === 'text') {
      // Prevent draft if user clicked on an existing text annotation
      const target = event.target as Element
      if (target.closest('[data-text-annotation]') || target.closest('[data-text-popover]') || target.closest('[data-color-picker-portal]')) return
      setDraftText({
        x: (event.clientX - pageBox.left) / pageBox.width,
        y: (event.clientY - pageBox.top) / pageBox.height,
        text: '',
        color: textColor,
        fontFamily: textFontFamily,
        fontSize: textFontSize,
        bold: textBold,
        italic: textItalic,
        underline: textUnderline
      })
    }
  }

  // Draw mode: track pointer events for drawing on the overlay canvas.
  // Read tool from the store directly (not the prop) to avoid stale closure during
  // React 18's event batching — the prop won't update until after the handler returns.
  const handleDrawPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const currentTool = useViewerStore.getState().tool
    if (currentTool !== 'draw' || !wrapperRef.current) return
    event.preventDefault()
    const bounds = wrapperRef.current.getBoundingClientRect()
    const nx = (event.clientX - bounds.left) / bounds.width
    const ny = (event.clientY - bounds.top) / bounds.height

    drawingRef.current.isDrawing = true
    drawingRef.current.path = [{ x: nx, y: ny }]
    setForceRender((n) => n + 1)

    const track = (pointer: PointerEvent) => {
      if (!wrapperRef.current) return
      const b = wrapperRef.current.getBoundingClientRect()
      const px = (pointer.clientX - b.left) / b.width
      const py = (pointer.clientY - b.top) / b.height
      drawingRef.current.path.push({ x: px, y: py })
      setForceRender((n) => n + 1)
    }

    const release = () => {
      const drawing = drawingRef.current
      drawingRef.current.isDrawing = false
      setForceRender((n) => n + 1)

      if (drawing.path.length > 1) {
        // Build one complete SVG path string: "M x0 y0 L x1 y1 L x2 y2 …"
        const d =
          `M ${drawing.path[0].x} ${drawing.path[0].y} ` +
          drawing.path
            .slice(1)
            .map((point) => `L ${point.x} ${point.y}`)
            .join(' ')
        // Normalise thickness to the 0-1 viewBox: divide raw CSS-pixel value by page width
        // so the SVG strokeWidth renders at the same pixel size as the live canvas preview.
        const normalisedThickness = drawing.thickness / (wrapperRef.current?.getBoundingClientRect().width ?? 1)
        onDraw({ paths: [d], color: drawing.color, thickness: normalisedThickness })
      }
      drawing.path = []

      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerup', release)
    }

    window.addEventListener('pointermove', track)
    window.addEventListener('pointerup', release)
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

  // Same clamping for the text composer card
  const textComposerPosition = (() => {
    if (!draftText) return null
    const maxLeft = Math.max(EDGE_MARGIN, viewport.width - TEXT_BOX_WIDTH - EDGE_MARGIN)
    const maxTop = Math.max(EDGE_MARGIN, viewport.height - TEXT_BOX_HEIGHT - EDGE_MARGIN)
    return {
      left: Math.min(Math.max(draftText.x * viewport.width, EDGE_MARGIN), maxLeft),
      top: Math.min(Math.max(draftText.y * viewport.height, EDGE_MARGIN), maxTop),
      width: Math.min(TEXT_BOX_WIDTH, viewport.width - EDGE_MARGIN * 2)
    }
  })()

  // Determine cursor based on tool
  const pageCursor = (() => {
    if (tool === 'draw') return pencilCursor(drawColor)
    if (tool === 'text') return textCursor()
    if (tool === 'highlight') return markerCursor(highlightColor)
    if (tool === 'note') return 'crosshair'
    return selectCursor()
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
        cursor: pageCursor
      }}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onPointerDown={handleDrawPointerDown}
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
            onUpdateText={onUpdateText}
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

          {/* Drawing overlay canvas — receives pointer events and delegates to the wrapper handler */}
          {tool === 'draw' && (
            <canvas
              ref={drawCanvasRef}
              className="absolute inset-0"
              style={{ width: viewport.width, height: viewport.height }}
              width={Math.round(viewport.width)}
              height={Math.round(viewport.height)}
            />
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

      {/* ── Text composer: note-style card with inline style controls ────── */}
      {draftText && textComposerPosition && (
        <div
          className="animate-pop absolute z-30 w-64 rounded-xl border border-line bg-surface p-2.5 text-xs shadow-lift"
          style={{ left: textComposerPosition.left, top: textComposerPosition.top, width: textComposerPosition.width }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Plain unstyled while typing so it never shows bold/underline */}
          <textarea
            autoFocus
            rows={2}
            placeholder="Type text…"
            className="w-full resize-none rounded-lg border border-line bg-surface-2 p-2 font-normal text-ink outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
            style={{
              fontFamily: draftText.fontFamily,
              fontWeight: 'normal',
              fontStyle: 'normal',
              textDecoration: 'none'
            }}
            value={draftText.text}
            onChange={(event) => setDraftText({ ...draftText, text: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setDraftText(null)
                return
              }
              if (event.key === 'Enter' && !event.shiftKey && draftText.text.trim()) {
                event.preventDefault()
                const pageH = wrapperRef.current?.getBoundingClientRect().height ?? 1
                onText({
                  x: draftText.x,
                  y: draftText.y,
                  text: draftText.text.trim(),
                  color: draftText.color,
                  fontFamily: draftText.fontFamily,
                  // Normalise by page height so text scales correctly with zoom
                  fontSize: draftText.fontSize / pageH,
                  bold: draftText.bold,
                  italic: draftText.italic,
                  underline: draftText.underline
                })
                setDraftText(null)
              }
            }}
          />

          {/* Colour swatches + custom color picker */}
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Colour</p>
            <ColorPicker
              label="Text"
              presets={DRAW_PRESETS}
              value={draftText.color}
              customColor={customTextColor}
              onChange={(color) => setDraftText({ ...draftText, color })}
              onCustomColor={(color) => {
                setCustomTextColor(color)
                setDraftText({ ...draftText, color })
              }}
            />
          </div>

          {/* Font size */}
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Size</p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setDraftText({ ...draftText, fontSize: Math.max(8, draftText.fontSize - 2) })
                }
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
                aria-label="Decrease size"
              >
                −
              </button>
              <span className="flex-1 text-center text-xs font-medium tabular-nums text-ink">
                {draftText.fontSize}px
              </span>
              <button
                type="button"
                onClick={() =>
                  setDraftText({ ...draftText, fontSize: Math.min(72, draftText.fontSize + 2) })
                }
                className="flex h-6 w-6 items-center justify-center rounded-lg border border-line bg-surface-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
                aria-label="Increase size"
              >
                +
              </button>
            </div>
          </div>

          {/* Style toggles */}
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Style</p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setDraftText({ ...draftText, bold: !draftText.bold })}
                aria-pressed={draftText.bold}
                aria-label="Bold"
                className={`flex h-7 flex-1 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                  draftText.bold
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line text-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => setDraftText({ ...draftText, italic: !draftText.italic })}
                aria-pressed={draftText.italic}
                aria-label="Italic"
                className={`flex h-7 flex-1 items-center justify-center rounded-lg border text-sm italic transition-all ${
                  draftText.italic
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line text-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => setDraftText({ ...draftText, underline: !draftText.underline })}
                aria-pressed={draftText.underline}
                aria-label="Underline"
                className={`flex h-7 flex-1 items-center justify-center rounded-lg border text-sm underline transition-all ${
                  draftText.underline
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line text-muted hover:border-line-strong hover:text-ink'
                }`}
              >
                U
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2.5 flex justify-end gap-2 border-t border-line pt-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-danger transition hover:bg-danger-soft"
              onClick={() => setDraftText(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-accent px-2.5 py-1 font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-45"
              disabled={!draftText.text.trim()}
              onClick={() => {
                const pageH = wrapperRef.current?.getBoundingClientRect().height ?? 1
                onText({
                  x: draftText.x,
                  y: draftText.y,
                  text: draftText.text.trim(),
                  color: draftText.color,
                  fontFamily: draftText.fontFamily,
                  fontSize: draftText.fontSize / pageH,
                  bold: draftText.bold,
                  italic: draftText.italic,
                  underline: draftText.underline
                })
                setDraftText(null)
              }}
            >
              Add text
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
