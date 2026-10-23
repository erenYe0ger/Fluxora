import { useEffect, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

/**
 * Loads page proxies up front. pdf.js caches them, and having every page means the
 * scroll container can reserve correct heights before rendering.
 */
export function usePdfPages(doc: PDFDocumentProxy | null) {
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!doc) {
      setPages([])
      return
    }

    let cancelled = false
    setPages([])

    const load = async () => {
      try {
        const loaded: PDFPageProxy[] = []
        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          const page = await doc.getPage(pageNumber)
          if (cancelled) return
          loaded.push(page)
          setPages([...loaded])
        }
      } catch (cause) {
        if (cancelled) return
        setError(cause instanceof Error ? cause.message : 'Could not read pages')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [doc])

  return { pages, error }
}
