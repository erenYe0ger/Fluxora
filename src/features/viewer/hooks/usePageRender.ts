import { useCallback, useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'

type Props = {
  page: PDFPageProxy | null
  scale: number
  canvasRef: React.RefObject<HTMLCanvasElement | null>
}

// Render the page to canvas; text layer is handled separately by useTextLayer.
export function usePageRender({ page, scale, canvasRef }: Props) {
  const renderTaskRef = useRef<unknown>(null)

  const render = useCallback(async () => {
    if (!page || !canvasRef.current) return
    const canvas = canvasRef.current
    const viewport = page.getViewport({ scale })
    const context = canvas.getContext('2d')
    if (!context) return

    // Use device pixel ratio for crisper rendering
    const outputScale = window.devicePixelRatio || 1
    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = `${viewport.width}px`
    canvas.style.height = `${viewport.height}px`

    const transform =
      outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined

    const task = page.render({
      canvasContext: context,
      viewport,
      transform
    } as Parameters<typeof page.render>[0])
    renderTaskRef.current = task
    try {
      await task.promise
    } catch {
      // Ignore cancelled renders (e.g. page changed)
    }
  }, [page, scale, canvasRef])

  useEffect(() => {
    render()
    return () => {
      const task = renderTaskRef.current as { cancel?: () => void } | null
      task?.cancel?.()
    }
  }, [render])
}
