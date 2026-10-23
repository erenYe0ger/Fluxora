import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useAnnotations } from '@features/annotations/hooks/useAnnotations'
import { deleteAnnotation, listAnnotations } from '@features/annotations/storage'

const DOC = 'undo-doc'

function highlightInput(text = 'hello') {
  return {
    docId: DOC,
    page: 1,
    kind: 'highlight' as const,
    color: '#fde047',
    rects: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.02 }],
    text
  }
}

async function mountReader(docId: string) {
  const rendered = renderHook(() => useAnnotations(docId))
  await waitFor(() => expect(rendered.result.current.loading).toBe(false))
  return rendered
}

describe('useAnnotations undo', () => {
  beforeEach(async () => {
    for (const annotation of await listAnnotations(DOC)) {
      await deleteAnnotation(annotation.id)
    }
  })

  it('starts with nothing to undo', async () => {
    const { result } = await mountReader(DOC)
    expect(result.current.canUndo).toBe(false)
  })

  it('undoes an added highlight, including in storage', async () => {
    const { result } = await mountReader(DOC)

    await act(async () => {
      await result.current.addHighlight(highlightInput('first'))
    })
    expect(result.current.annotations).toHaveLength(1)
    expect(result.current.canUndo).toBe(true)

    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.annotations).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(await listAnnotations(DOC)).toEqual([])
  })

  it('undoes a delete by restoring the annotation', async () => {
    const { result } = await mountReader(DOC)

    await act(async () => {
      await result.current.addHighlight(highlightInput('to delete'))
    })
    const added = result.current.annotations[0]

    await act(async () => {
      await result.current.removeAnnotation(added.id)
    })
    expect(result.current.annotations).toHaveLength(0)

    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.annotations.map((row) => row.id)).toEqual([added.id])
    expect((await listAnnotations(DOC)).map((row) => row.id)).toEqual([added.id])
  })

  it('ignores undo when the history is empty', async () => {
    const { result } = await mountReader(DOC)
    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.annotations).toEqual([])
  })

  it('undoes in reverse order across several annotations', async () => {
    const { result } = await mountReader(DOC)

    await act(async () => {
      await result.current.addHighlight(highlightInput('one'))
      await result.current.addNote({
        docId: DOC,
        page: 1,
        kind: 'note',
        color: '#f59e0b',
        x: 0.5,
        y: 0.5,
        text: 'two'
      })
    })
    expect(result.current.annotations).toHaveLength(2)

    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.annotations.map((row) => row.kind)).toEqual(['highlight'])

    await act(async () => {
      await result.current.undo()
    })
    expect(result.current.annotations).toEqual([])
    expect(await listAnnotations(DOC)).toEqual([])
  })

  it('does not persist history across reloads', async () => {
    const { result } = await mountReader(DOC)
    await act(async () => {
      await result.current.addHighlight(highlightInput('kept'))
    })

    await act(async () => {
      await result.current.reload()
    })
    expect(result.current.annotations).toHaveLength(1)
    expect(result.current.canUndo).toBe(false)
  })
})
