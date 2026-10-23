import type { Match } from './findMatches'

export type TextSpan = {
  node: Text
  start: number
  end: number
}

export type TextMap = {
  text: string
  spans: TextSpan[]
}

/**
 * Flatten the text layer into one string plus a char-offset map back to DOM nodes.
 * This lets search highlight ranges that cross several positioned spans.
 */
export function buildTextMap(root: HTMLElement): TextMap {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const spans: TextSpan[] = []
  let text = ''
  let current: Node | null = walker.nextNode()

  while (current) {
    const node = current as Text
    const value = node.nodeValue ?? ''
    if (value.length > 0) {
      spans.push({ node, start: text.length, end: text.length + value.length })
      text += value
    }
    current = walker.nextNode()
  }

  return { text, spans }
}

export type MatchRange = {
  startNode: Text
  startOffset: number
  endNode: Text
  endOffset: number
}

/** Translate a match in the flattened string back into a DOM range. */
export function locateMatch(spans: TextSpan[], match: Match): MatchRange | null {
  const startSpan = spans.find((span) => match.start >= span.start && match.start < span.end)
  const endSpan = spans.find((span) => match.end > span.start && match.end <= span.end)
  if (!startSpan || !endSpan) return null

  return {
    startNode: startSpan.node,
    startOffset: match.start - startSpan.start,
    endNode: endSpan.node,
    endOffset: match.end - endSpan.start
  }
}
