import { useCallback, useState } from 'react'
import type { DocumentMeta } from '@shared/lib/documents'
import { listDocuments, saveDocument, deleteDocument } from '@shared/lib/documents'

function uid() {
  return crypto.randomUUID()
}

const MAX_FILE_BYTES = 200 * 1024 * 1024

export function useLibrary() {
  const [docs, setDocs] = useState<DocumentMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setDocs(await listDocuments())
    } catch {
      setError('Could not read local storage. Private windows may block IndexedDB.')
    } finally {
      setLoading(false)
    }
  }, [])

  const importFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      setError(null)

      for (const file of Array.from(files)) {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        if (!isPdf) {
          setError(`${file.name} is not a PDF.`)
          continue
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(`${file.name} is larger than 200 MB.`)
          continue
        }
        try {
          const data = await file.arrayBuffer()
          await saveDocument({
            id: uid(),
            name: file.name,
            size: file.size,
            addedAt: Date.now(),
            data
          })
        } catch {
          setError(`Could not store ${file.name}. Browser storage may be full.`)
        }
      }

      await refresh()
    },
    [refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteDocument(id)
      await refresh()
    },
    [refresh]
  )

  return { docs, loading, error, refresh, importFiles, remove }
}
