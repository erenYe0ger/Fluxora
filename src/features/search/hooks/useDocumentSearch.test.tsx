import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useDocumentSearch } from './useDocumentSearch'

/** Minimal stand-in for pdf.js: only getTextContent matters to the search engine. */
function fakeDocument(pages: string[]): PDFDocumentProxy {
  return {
    numPages: pages.length,
    getPage: async (pageNumber: number) => ({
      getTextContent: async () => ({ items: [{ str: pages[pageNumber - 1] }] })
    })
  } as unknown as PDFDocumentProxy
}

describe('useDocumentSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reports searching as soon as the query changes, before any results exist', () => {
    const doc = fakeDocument(['alpha beta'])
    const { result } = renderHook(() => useDocumentSearch(doc, () => {}))

    act(() => {
      result.current.setQuery('beta')
    })

    expect(result.current.searching).toBe(true)
    expect(result.current.total).toBe(0)
  })

  it('counts matches across pages and stops searching when settled', async () => {
    const doc = fakeDocument(['alpha beta', 'beta gamma', 'nothing here'])
    const { result } = renderHook(() => useDocumentSearch(doc, () => {}))

    act(() => {
      result.current.setQuery('beta')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    expect(result.current.searching).toBe(false)
    expect(result.current.total).toBe(2)
  })

  it('goes back to searching when the query changes again', async () => {
    const doc = fakeDocument(['alpha beta'])
    const { result } = renderHook(() => useDocumentSearch(doc, () => {}))

    act(() => {
      result.current.setQuery('beta')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })
    expect(result.current.searching).toBe(false)

    act(() => {
      result.current.setQuery('beta g')
    })
    expect(result.current.searching).toBe(true)
  })

  it('clears results and the searching flag', async () => {
    const doc = fakeDocument(['alpha beta'])
    const { result } = renderHook(() => useDocumentSearch(doc, () => {}))

    act(() => {
      result.current.setQuery('beta')
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300)
    })

    act(() => {
      result.current.clear()
    })

    expect(result.current.query).toBe('')
    expect(result.current.total).toBe(0)
    expect(result.current.searching).toBe(false)
  })

  it('does not search for an empty query', async () => {
    const doc = fakeDocument(['alpha beta'])
    const { result } = renderHook(() => useDocumentSearch(doc, () => {}))

    act(() => {
      result.current.setQuery('   ')
    })

    expect(result.current.searching).toBe(false)
  })
})
