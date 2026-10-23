import { useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { useElementSize } from '@shared/hooks/useElementSize'
import { useViewerStore } from '../store/viewerStore'
import { fitWidthScale } from '../lib/zoom'

/** Breathing room left and right of the page, on top of the scroll area's own padding. */
const SIDE_INSET = 56

/**
 * Owns the scroll container: keeps "current page" in sync with scroll position and
 * keeps the page fitted to the reading width until the user zooms manually.
 */
export function useReaderLayout(pages: PDFPageProxy[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(containerRef)
  const autoFit = useViewerStore((state) => state.autoFit)
  const applyScale = useViewerStore((state) => state.applyScale)
  const setCurrentPage = useViewerStore((state) => state.setCurrentPage)

  const firstPage = pages[0]
  // A plain number so the effect below does not re-run on every render.
  const pageWidth = firstPage ? firstPage.getViewport({ scale: 1 }).width : 0

  useEffect(() => {
    if (!autoFit) return
    applyScale(fitWidthScale(width, pageWidth, SIDE_INSET))
  }, [applyScale, autoFit, pageWidth, width])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const top = container.getBoundingClientRect().top
        const anchor = top + container.clientHeight * 0.35
        let best = 1
        for (const element of container.querySelectorAll<HTMLElement>('[data-page]')) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= anchor) best = Number(element.dataset.page)
        }
        setCurrentPage(best)
      })
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [setCurrentPage, pages.length])

  return { containerRef }
}
