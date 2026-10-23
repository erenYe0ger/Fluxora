import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePageRender } from '../hooks/usePageRender'
import { useTextLayer } from '../hooks/useTextLayer'
import { useSearchRects } from '../hooks/useSearchRects'
import { useInView } from '@shared/hooks/useInView'
import type { Annotation, HighlightColor, Rect } from '@features/annotations'
import { clampRect, normalizeRect, toCssBox } from '@features/annotations'
import { AnnotationLayer } from '@features/annotations'

type Props = {
  page: PDFPageProxy
  scale: number
  tool: 'select' | 'highlight' | 'note'
  color: HighlightColor
  annotations: Annotation[]
  searchQuery: string
  activeMatch: number | null
  onHighlight: (input: { rects: Rect[]; text: string }) => void
  onNote: (input: { x: number; y: number; text: string }) => void
  onDeleteAnnotation: (id: string) => void
}

/**
 * One PDF page: canvas + text layer + annotation overlay.
 * Canvas work is deferred until the page approaches the viewport.
 */
export function PdfPageView({
  page,
  scale,
  tool,
  color,
  annotations,
  searchQuery,
  activeMatch,
  onHighlight,
  onNote,
  onDeleteAnnotation
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

  const pageAnnotations = annotations.filter((annotation) => annotation.page === page.pageNumber)

  // Selection -> highlight. Uses client rects so multi-line selections produce
  // one box per line, then normalises them for zoom-independent storage.
  const handleMouseUp = () => {
    if (tool !== 'highlight') return
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed || !textLayerRef.current || !wrapperRef.current) return
    if (!textLayerRef.current.contains(selection.anchorNode)) return

    const text = selection.toString().trim()
    const pageBox = wrapperRef.current.getBoundingClientRect()
    const rects = Array.from(selection.getRangeAt(0).getClientRects())
      .filter((rect) => rect.width > 1 && rect.height > 1)
      .map((rect) => clampRect(normalizeRect(rect, pageBox)))

    if (text && rects.length > 0) onHighlight({ rects, text })
    selection.removeAllRanges()
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (tool !== 'note' || !wrapperRef.current) return
    const pageBox = wrapperRef.current.getBoundingClientRect()
    const x = (event.clientX - pageBox.left) / pageBox.width
    const y = (event.clientY - pageBox.top) / pageBox.height
    setDraftNote({ x, y, text: '' })
  }

  return (
    <div
      id={`page-${page.pageNumber}`}
      ref={wrapperRef}
      data-page={page.pageNumber}
      className="relative mx-auto w-fit bg-white shadow-lg"
      style={{ width: viewport.width, height: viewport.height }}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
    >
      {inView ? (
        <>
          <canvas ref={canvasRef} className="block" />
          <div ref={textLayerRef} className="textLayer" />
          <AnnotationLayer annotations={pageAnnotations} onDelete={onDeleteAnnotation} />

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
        <div className="flex h-full items-center justify-center text-xs text-slate-400">
          Page {page.pageNumber}
        </div>
      )}

      {draftNote && (
        <div
          className="absolute z-30 w-56 rounded border border-slate-300 bg-white p-2 text-xs shadow-xl dark:border-slate-600 dark:bg-slate-800"
          style={{ left: `${draftNote.x * 100}%`, top: `${draftNote.y * 100}%` }}
          onClick={(event) => event.stopPropagation()}
        >
          <textarea
            autoFocus
            rows={3}
            placeholder="Write a note…"
            className="w-full resize-none rounded border border-slate-300 bg-transparent p-1 outline-none dark:border-slate-600"
            value={draftNote.text}
            onChange={(event) => setDraftNote({ ...draftNote, text: event.target.value })}
          />
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" className="text-slate-500" onClick={() => setDraftNote(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="font-medium text-blue-600"
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

      {/* colour stripe hint so the active tool is visible at the page level */}
      <span
        className="pointer-events-none absolute -left-2 top-0 h-full w-1 rounded"
        style={{ backgroundColor: tool === 'select' ? 'transparent' : color }}
        aria-hidden
      />
    </div>
  )
}
