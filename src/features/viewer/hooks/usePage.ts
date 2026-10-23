import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

export function usePage(doc: PDFDocumentProxy | null, pageNumber: number) {
  const [page, setPage] = useState<PDFPageProxy | null>(null)
  const cacheRef = useRef<Map<number, PDFPageProxy>>(new Map())

  useEffect(() => {
    if (!doc) {
      setPage(null)
      return
    }
    const cached = cacheRef.current.get(pageNumber)
    if (cached) {
      setPage(cached)
      return
    }
    doc.getPage(pageNumber).then((p) => {
      cacheRef.current.set(pageNumber, p)
      setPage(p)
    })
  }, [doc, pageNumber])

  return page
}
