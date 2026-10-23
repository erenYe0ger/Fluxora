import { findMatches } from '@features/search'
import { buildTextMap, locateMatch } from '@features/search'
import type { Rect } from '@features/annotations'
import { clampRect, normalizeRect } from '@features/annotations'

type Params = {
  pageElement: HTMLElement | null
  textLayerElement: HTMLElement | null
  query: string
}

/**
 * Convert search hits in the text layer into page-relative boxes.
 * Done in the DOM because only the browser knows where each text run lands.
 */
export function collectSearchRects({ pageElement, textLayerElement, query }: Params): Rect[][] {
  if (!pageElement || !textLayerElement || !query.trim()) return []

  const map = buildTextMap(textLayerElement)
  if (!map.text) return []

  const matches = findMatches(map.text, query)
  if (matches.length === 0) return []

  const pageBox = pageElement.getBoundingClientRect()

  return matches.map((match) => {
    const located = locateMatch(map.spans, match)
    if (!located) return []

    const range = document.createRange()
    range.setStart(located.startNode, located.startOffset)
    range.setEnd(located.endNode, located.endOffset)

    return Array.from(range.getClientRects())
      .filter((rect) => rect.width > 1 && rect.height > 1)
      .map((rect) => clampRect(normalizeRect(rect, pageBox)))
  })
}
