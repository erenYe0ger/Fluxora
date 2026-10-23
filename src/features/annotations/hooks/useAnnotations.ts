import { useCallback, useEffect, useRef, useState } from 'react'
import type { Annotation, HighlightAnnotation, NoteAnnotation } from '../types'
import { deleteAnnotation, listAnnotations, saveAnnotation } from '../storage'

type NewHighlight = Omit<HighlightAnnotation, 'id' | 'createdAt'>
type NewNote = Omit<NoteAnnotation, 'id' | 'createdAt'>

/** Inverse operation we can replay when the user presses Ctrl+Z. */
type HistoryEntry = { type: 'add' | 'delete'; annotation: Annotation }

const MAX_HISTORY = 50

const byPageThenTime = (a: Annotation, b: Annotation) =>
  a.page - b.page || a.createdAt - b.createdAt

export function useAnnotations(docId: string | undefined) {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(true)
  const [historyDepth, setHistoryDepth] = useState(0)
  const historyRef = useRef<HistoryEntry[]>([])

  const record = useCallback((entry: HistoryEntry) => {
    historyRef.current = [...historyRef.current, entry].slice(-MAX_HISTORY)
    setHistoryDepth(historyRef.current.length)
  }, [])

  const reload = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      const rows = await listAnnotations(docId)
      setAnnotations(rows)
      // History belongs to the session, not the document: a fresh load starts clean.
      historyRef.current = []
      setHistoryDepth(0)
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
      setAnnotations((prev) => [...prev, annotation].sort(byPageThenTime))
      record({ type: 'add', annotation })
    },
    [record]
  )

  const addNote = useCallback(
    async (input: NewNote) => {
      const annotation: NoteAnnotation = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: Date.now()
      }
      await saveAnnotation(annotation)
      setAnnotations((prev) => [...prev, annotation].sort(byPageThenTime))
      record({ type: 'add', annotation })
    },
    [record]
  )

  const removeAnnotation = useCallback(
    async (id: string) => {
      const target = annotations.find((annotation) => annotation.id === id)
      await deleteAnnotation(id)
      setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id))
      if (target) record({ type: 'delete', annotation: target })
    },
    [annotations, record]
  )

  /** Move a note pin. Dragging is not undoable, so it is deliberately not recorded. */
  const moveAnnotation = useCallback(
    async (id: string, x: number, y: number) => {
      const target = annotations.find((annotation) => annotation.id === id)
      if (!target || target.kind !== 'note') return
      const moved: NoteAnnotation = {
        ...target,
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y))
      }
      await saveAnnotation(moved)
      setAnnotations((prev) =>
        prev.map((annotation) => (annotation.id === id ? moved : annotation))
      )
    },
    [annotations]
  )

  /** Undo the most recent add or delete by applying its inverse. */
  const undo = useCallback(async () => {
    const entry = historyRef.current[historyRef.current.length - 1]
    if (!entry) return
    historyRef.current = historyRef.current.slice(0, -1)
    setHistoryDepth(historyRef.current.length)

    if (entry.type === 'add') {
      await deleteAnnotation(entry.annotation.id)
      setAnnotations((prev) => prev.filter((annotation) => annotation.id !== entry.annotation.id))
    } else {
      await saveAnnotation(entry.annotation)
      setAnnotations((prev) => [...prev, entry.annotation].sort(byPageThenTime))
    }
  }, [])

  return {
    annotations,
    loading,
    addHighlight,
    addNote,
    removeAnnotation,
    moveAnnotation,
    undo,
    canUndo: historyDepth > 0,
    reload
  }
}
