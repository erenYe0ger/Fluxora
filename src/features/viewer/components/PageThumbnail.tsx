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
      className={`block w-full rounded border p-1 text-center transition ${
        active
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <canvas
        ref={canvasRef}
        className="mx-auto block bg-white"
        style={{ width: viewport.width, height: viewport.height }}
      />
      <span className="mt-1 block text-[10px] text-slate-500">{page.pageNumber}</span>
    </button>
  )
}
