import { beforeEach, describe, expect, it } from 'vitest'
import { deleteAnnotation, listAnnotations, saveAnnotation } from '@features/annotations/storage'
import type { HighlightAnnotation } from '@features/annotations'
import { deleteDocument, getDocument, listDocuments, saveDocument } from '@shared/lib/documents'

function highlight(overrides: Partial<HighlightAnnotation> = {}): HighlightAnnotation {
  return {
    id: crypto.randomUUID(),
    docId: 'doc-1',
    page: 1,
    kind: 'highlight',
    color: '#fde047',
    rects: [{ x: 0.1, y: 0.1, width: 0.2, height: 0.02 }],
    text: 'hello',
    createdAt: Date.now(),
    ...overrides
  }
}

describe('annotation storage', () => {
  beforeEach(async () => {
    // Storage is shared per test file, so clear what previous cases wrote.
    for (const annotation of await listAnnotations('doc-1')) {
      await deleteAnnotation(annotation.id)
    }
  })

  it('stores and reads annotations back by document', async () => {
    const first = highlight({ page: 2 })
    const second = highlight({ page: 1 })
    await saveAnnotation(first)
    await saveAnnotation(second)

    const rows = await listAnnotations('doc-1')
    expect(rows.map((row) => row.page)).toEqual([1, 2])
  })

  it('scopes annotations to their document', async () => {
    await saveAnnotation(highlight({ docId: 'doc-2' }))
    expect(await listAnnotations('doc-1')).toEqual([])
    expect(await listAnnotations('doc-2')).toHaveLength(1)
  })

  it('deletes by id', async () => {
    const annotation = highlight()
    await saveAnnotation(annotation)
    await deleteAnnotation(annotation.id)
    expect(await listAnnotations('doc-1')).toEqual([])
  })
})

describe('document storage', () => {
  it('round-trips a document record', async () => {
    const data = new TextEncoder().encode('%PDF-1.4 fake').buffer
    await saveDocument({ id: 'doc-x', name: 'x.pdf', size: data.byteLength, addedAt: 1, data })

    const stored = await getDocument('doc-x')
    expect(stored?.name).toBe('x.pdf')
    expect(stored?.data.byteLength).toBe(data.byteLength)

    expect((await listDocuments()).some((doc) => doc.id === 'doc-x')).toBe(true)

    await deleteDocument('doc-x')
    expect(await getDocument('doc-x')).toBeUndefined()
  })

  it('removes a document and its annotations together', async () => {
    const data = new TextEncoder().encode('%PDF-1.4 fake').buffer
    await saveDocument({ id: 'doc-y', name: 'y.pdf', size: data.byteLength, addedAt: 2, data })
    await saveAnnotation(highlight({ docId: 'doc-y' }))

    await deleteDocument('doc-y')

    expect(await getDocument('doc-y')).toBeUndefined()
    expect(await listAnnotations('doc-y')).toEqual([])
  })
})
