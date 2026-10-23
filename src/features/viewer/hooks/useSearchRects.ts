import { useEffect, useState } from 'react'
import { collectSearchRects } from '../lib/searchRects'
import type { Rect } from '@features/annotations'

type Params = {
  pageElement: HTMLElement | null
  textLayerElement: HTMLElement | null
  query: string
  textVersion: number
  scale: number
}

/** Recompute highlight boxes whenever the query, zoom or text layer changes. */
export function useSearchRects({
  pageElement,
  textLayerElement,
  query,
  textVersion,
  scale
}: Params): Rect[][] {
  const [rects, setRects] = useState<Rect[][]>([])

  useEffect(() => {
    if (!query.trim() || textVersion === 0) {
      setRects([])
      return
    }
    setRects(collectSearchRects({ pageElement, textLayerElement, query }))
  }, [pageElement, textLayerElement, query, textVersion, scale])

  return rects
}
