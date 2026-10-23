import { useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { useInView } from '@shared/hooks/useInView'

type Props = {
  page: PDFPageProxy
  width: number
  active: boolean
  onSelect: (page: number) => void
}

/** Cap the backing-store multiplier: 3x on a 4K retina panel buys nothing but memory. */
const MAX_PIXEL_RATIO = 3

/** Small canvas preview; rendered only when the rail item scrolls into view. */
export function PageThumbnail({ page, width, active, onSelect }: Props) {
  const wrapperRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inView = useInView(wrapperRef, '300px')

  const base = page.getViewport({ scale: 1 })
  // Render at device pixels and let CSS scale the bitmap down, otherwise the thumbnail
  // is drawn at 1x and looks soft next to the crisp page canvas.
  const ratio = Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
  const viewport = page.getViewport({ scale: (width * ratio) / base.width })
  const cssWidth = width
  const cssHeight = cssWidth * (base.height / base.width)

  useEffect(() => {
    if (!inView || !canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    context.imageSmoothingQuality = 'high'
    const task = page.render({ canvas, canvasContext: context, viewport })
    task.promise.catch(() => {
      // Thumbnail rendering is best-effort; navigation still works without it.
    })
    return () => task.cancel()
  }, [inView, page, viewport])

  return (
    <button
      ref={wrapperRef}
      type="button"
      onClick={() => onSelect(page.pageNumber)}
      aria-label={`Page ${page.pageNumber}`}
      aria-current={active ? 'page' : undefined}
      className={`group flex w-full flex-col items-center gap-1.5 rounded-lg p-1.5 transition duration-150 ${
        active ? 'bg-accent-soft' : 'hover:bg-surface-2'
      }`}
    >
      <span
        className={`block overflow-hidden rounded-md bg-white ring-1 transition duration-150 ${
          active ? 'ring-2 ring-accent' : 'ring-black/15 group-hover:ring-line-strong'
        }`}
        style={{ width: cssWidth, height: cssHeight }}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: cssWidth, height: cssHeight }}
        />
      </span>
      <span
        className={`text-[11px] font-medium tabular-nums ${
          active ? 'text-accent' : 'text-muted'
        }`}
      >
        {page.pageNumber}
      </span>
    </button>
  )
}
