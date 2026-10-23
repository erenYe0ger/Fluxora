import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { countMatches } from '../lib/findMatches'

export type PageHit = { page: number; count: number }

export type ActiveMatch = { page: number; localIndex: number }

/** Flattened text per page, cached because getTextContent is expensive. */
type TextCache = Map<number, string>

export function useDocumentSearch(doc: PDFDocumentProxy | null, onJumpToPage: (page: number) => void) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<PageHit[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [searching, setSearching] = useState(false)
  const cacheRef = useRef<TextCache>(new Map())
  const runIdRef = useRef(0)

  // A new document invalidates cached text.
  useEffect(() => {
    cacheRef.current.clear()
    setHits([])
    setActiveIndex(0)
  }, [doc])

  const total = useMemo(() => hits.reduce((sum, hit) => sum + hit.count, 0), [hits])

  const active: ActiveMatch | null = useMemo(() => {
    if (total === 0) return null
    let remaining = activeIndex
    for (const hit of hits) {
      if (remaining < hit.count) return { page: hit.page, localIndex: remaining }
      remaining -= hit.count
    }
    return { page: hits[0].page, localIndex: 0 }
  }, [activeIndex, hits, total])

  const clear = useCallback(() => {
    setQuery('')
    setHits([])
    setActiveIndex(0)
  }, [])

  // Debounced search across all pages. Sequential on purpose: keeps memory flat
  // for large files and gives us a cancellable run id.
  useEffect(() => {
    const term = query.trim()
    if (!doc || !term) {
      setHits([])
      setActiveIndex(0)
      return
    }

    const runId = ++runIdRef.current
    setSearching(true)

    const timer = window.setTimeout(async () => {
      const pages: PageHit[] = []
      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        let text = cacheRef.current.get(pageNumber)
        if (text === undefined) {
          const page = await doc.getPage(pageNumber)
          const content = await page.getTextContent()
          // getTextContent concatenated without separators matches the DOM text
          // layer closely enough for hit counting and per-page ordinal mapping.
          text = content.items.map((item) => ('str' in item ? item.str : '')).join('')
          cacheRef.current.set(pageNumber, text)
        }
        const count = countMatches(text, term)
        if (count > 0) pages.push({ page: pageNumber, count })
        if (runId !== runIdRef.current) return
      }

      if (runId !== runIdRef.current) return
      setHits(pages)
      setActiveIndex(0)
      setSearching(false)
      if (pages.length > 0) onJumpToPage(pages[0].page)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [doc, query, onJumpToPage])

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return
      const wrapped = ((index % total) + total) % total
      setActiveIndex(wrapped)
      let remaining = wrapped
      for (const hit of hits) {
        if (remaining < hit.count) {
          onJumpToPage(hit.page)
          return
        }
        remaining -= hit.count
      }
    },
    [hits, onJumpToPage, total]
  )

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo])
  const previous = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo])

  return {
    query,
    setQuery,
    hits,
    total,
    active,
    activeIndex,
    searching,
    next,
    previous,
    clear
  }
}
