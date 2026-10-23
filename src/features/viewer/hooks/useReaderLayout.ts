import { useEffect, useRef } from 'react'
import type { PDFPageProxy } from 'pdfjs-dist'
import { useElementSize } from '@shared/hooks/useElementSize'
import { useViewerStore } from '../store/viewerStore'
import { fitPageScale } from '../lib/zoom'

/**
 * Owns the scroll container: keeps "current page" in sync with scroll position and
 * recomputes the fit-page scale when the viewport resizes or the user re-enters fit mode.
 */
export function useReaderLayout(pages: PDFPageProxy[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(containerRef)
  const fitMode = useViewerStore((state) => state.fitMode)
  const applyScale = useViewerStore((state) => state.applyScale)
  const setCurrentPage = useViewerStore((state) => state.setCurrentPage)

  const firstPage = pages[0]
  // Plain numbers so the effect below does not re-run on every render.
  const pageWidth = firstPage ? firstPage.getViewport({ scale: 1 }).width : 0
  const pageHeight = firstPage ? firstPage.getViewport({ scale: 1 }).height : 0

  useEffect(() => {
    if (fitMode !== 'fit') return
    // The scroll area already has padding, so the page may use the whole content box.
    applyScale(fitPageScale({ width, height }, { width: pageWidth, height: pageHeight }))
  }, [applyScale, fitMode, pageWidth, pageHeight, width, height])

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
