import { useEffect, useState } from 'react'
import { TextLayer } from '@shared/lib/pdf/pdfjs'
import type { PDFPageProxy } from 'pdfjs-dist'

type Props = {
  page: PDFPageProxy | null
  scale: number
  containerRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Builds pdf.js' transparent text layer on top of the canvas.
 * Returns a version counter so dependent effects (search highlights) can rerun
 * once the spans actually exist.
 */
export function useTextLayer({ page, scale, containerRef }: Props): number {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!page || !container) return

    let cancelled = false
    container.innerHTML = ''
    // TextLayer sizes itself from this variable.
    container.style.setProperty('--total-scale-factor', String(scale))

    const viewport = page.getViewport({ scale })
    const layer = new TextLayer({
      textContentSource: page.streamTextContent(),
      container,
      viewport
    })

    layer
      .render()
      .then(() => {
        if (!cancelled) setVersion((current) => current + 1)
      })
      .catch(() => {
        // A cancelled layer (zoom/scroll change) is expected; real failures surface
        // as a missing text layer, which the search UI reports as "no matches".
      })

    return () => {
      cancelled = true
      layer.cancel()
      container.innerHTML = ''
    }
  }, [page, scale, containerRef])

  return version
}
