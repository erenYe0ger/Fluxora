import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAnnotations } from '@features/annotations/hooks/useAnnotations'
import { deleteAnnotation, listAnnotations } from '@features/annotations/storage'

const DOC = 'move-doc'

async function seedNote() {
  const rendered = renderHook(() => useAnnotations(DOC))
  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  await act(async () => {
    await rendered.result.current.addNote({
      docId: DOC,
      page: 1,
      kind: 'note',
      color: '#f59e0b',
      x: 0.2,
      y: 0.3,
      text: 'drag me'
    })
  })
  return { ...rendered, note: rendered.result.current.annotations[0] }
}

describe('useAnnotations moveAnnotation', () => {
  beforeEach(async () => {
    for (const annotation of await listAnnotations(DOC)) {
      await deleteAnnotation(annotation.id)
    }
  })

  it('moves a note and persists the new position', async () => {
    const { result, note } = await seedNote()

    await act(async () => {
      await result.current.moveAnnotation(note.id, 0.75, 0.6)
    })

    expect(result.current.annotations[0]).toMatchObject({ x: 0.75, y: 0.6 })
    const stored = await listAnnotations(DOC)
    expect(stored[0]).toMatchObject({ id: note.id, x: 0.75, y: 0.6 })
  })

  it('clamps positions into the page', async () => {
    const { result, note } = await seedNote()

    await act(async () => {
      await result.current.moveAnnotation(note.id, 1.4, -0.3)
    })

    expect(result.current.annotations[0]).toMatchObject({ x: 1, y: 0 })
  })

  it('ignores unknown ids', async () => {
    const { result } = await seedNote()
    const before = result.current.annotations.length

    await act(async () => {
      await result.current.moveAnnotation('missing', 0.5, 0.5)
    })

    expect(result.current.annotations).toHaveLength(before)
  })

  it('does not add an undo step for a move', async () => {
    const { result, note } = await seedNote()
    // The add itself is one undo step; moving must not push another.
    const depthBefore = result.current.canUndo

    await act(async () => {
      await result.current.moveAnnotation(note.id, 0.4, 0.4)
    })

    const afterMove = renderHook(() => useAnnotations(DOC))
    await waitFor(() => expect(afterMove.result.current.loading).toBe(false))
    expect(afterMove.result.current.canUndo).toBe(false)
    expect(depthBefore).toBe(true)
  })
})
