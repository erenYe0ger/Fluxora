export type Match = { start: number; end: number }

/**
 * Case-insensitive, non-overlapping search. Pure so the viewer can reuse it for
 * counting hits without touching the DOM.
 */
export function findMatches(haystack: string, needle: string): Match[] {
  const query = needle.trim().toLowerCase()
  if (!query) return []

  const text = haystack.toLowerCase()
  const matches: Match[] = []
  let cursor = 0

  while (cursor <= text.length - query.length) {
    const index = text.indexOf(query, cursor)
    if (index === -1) break
    matches.push({ start: index, end: index + query.length })
    cursor = index + query.length
  }

  return matches
}

export function countMatches(haystack: string, needle: string): number {
  return findMatches(haystack, needle).length
}

/** Short context snippet for the results list. */
export function excerptAround(text: string, match: Match, radius = 36): string {
  const start = Math.max(0, match.start - radius)
  const end = Math.min(text.length, match.end + radius)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`
}
