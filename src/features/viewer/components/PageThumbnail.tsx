import { useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { useInView } from '@shared/hooks/useInView'

type Props = {
  page: PDFPageProxy
  width: number
  active: boolean
  onSelect: (page: number) => void
}

/** Small canvas preview; rendered only when the rail item scrolls into view. */
export function PageThumbnail({ page, width, active, onSelect }: Props) {
  const wrapperRef = useRef<HTMLButtonElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inView = useInView(wrapperRef, '300px')

  const base = page.getViewport({ scale: 1 })
  const scale = width / base.width
  const viewport = page.getViewport({ scale })

  useEffect(() => {
    if (!inView || !canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = viewport.width
    canvas.height = viewport.height
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
      className={`group flex w-full flex-col items-center gap-1 rounded-lg p-1 transition duration-150 ${
        active ? 'bg-accent-soft' : 'hover:bg-surface-2'
      }`}
    >
      <span
        className={`block overflow-hidden rounded-md bg-white ring-1 transition duration-150 ${
          active
            ? 'ring-2 ring-accent'
            : 'ring-black/10 group-hover:ring-line-strong dark:ring-white/10'
        }`}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: viewport.width, height: viewport.height }}
        />
      </span>
      <span
        className={`text-[10px] font-medium tabular-nums ${
          active ? 'text-accent' : 'text-muted'
        }`}
      >
        {page.pageNumber}
      </span>
    </button>
  )
}
