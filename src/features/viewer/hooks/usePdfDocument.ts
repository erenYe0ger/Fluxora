import { useEffect, useRef, useState } from 'react'
import { pdfjsLib } from '@shared/lib/pdf/pdfjs'
import type { PDFDocumentProxy } from 'pdfjs-dist'

export function usePdfDocument(data: ArrayBuffer | null) {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const loadingRef = useRef(false)

  useEffect(() => {
    if (!data) return
    if (loadingRef.current) return
    loadingRef.current = true
    setError(null)
    setDoc(null)

    const task = pdfjsLib.getDocument({ data: data.slice(0) })
    task.promise
      .then((pdf) => {
        setDoc(pdf)
        setNumPages(pdf.numPages)
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to load PDF'
        setError(message)
      })
      .finally(() => {
        loadingRef.current = false
      })

    return () => {
      task.destroy()
    }
  }, [data])

  return { doc, numPages, error }
}
