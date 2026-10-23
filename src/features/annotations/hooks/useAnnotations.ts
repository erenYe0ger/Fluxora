import { useCallback, useEffect, useState } from 'react'
import type { Annotation, HighlightAnnotation, NoteAnnotation } from '../types'
import { deleteAnnotation, listAnnotations, saveAnnotation } from '../storage'

type NewHighlight = Omit<HighlightAnnotation, 'id' | 'createdAt'>
type NewNote = Omit<NoteAnnotation, 'id' | 'createdAt'>

export function useAnnotations(docId: string | undefined) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      setAnnotations(await listAnnotations(docId))
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => {
    reload()
  }, [reload])

  const addHighlight = useCallback(
    async (input: NewHighlight) => {
      const annotation: HighlightAnnotation = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      }
      await saveAnnotation(annotation)
      setAnnotations((prev) => [...prev, annotation])
    },
    []
  )

  const addNote = useCallback(async (input: NewNote) => {
    const annotation: NoteAnnotation = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    }
    await saveAnnotation(annotation)
    setAnnotations((prev) => [...prev, annotation])
  }, [])

  const removeAnnotation = useCallback(async (id: string) => {
    await deleteAnnotation(id)
    setAnnotations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { annotations, loading, addHighlight, addNote, removeAnnotation, reload }
}
