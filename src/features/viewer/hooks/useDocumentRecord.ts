import { useEffect, useState } from 'react'
import { getDocument } from '@shared/lib/documents'
import type { DocumentMeta } from '@shared/lib/documents'

export function useDocumentRecord(id: string | undefined) {
  const [meta, setMeta] = useState<DocumentMeta | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('No document selected.')
      return
    }
    let cancelled = false
    getDocument(id)
      .then((record) => {
        if (cancelled) return
        if (!record) setError('This document is no longer in your library.')
        else setMeta(record)
      })
      .catch(() => {
        if (!cancelled) setError('Could not open the document from local storage.')
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return { meta, error }
}
