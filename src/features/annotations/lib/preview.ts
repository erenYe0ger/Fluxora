/**
 * Sidebar previews are an index, not a second reading surface: cut on word boundaries
 * and only mark the cut when something was actually left out.
 */
export function previewText(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(' ')
  return `${words.slice(0, maxWords).join(' ')}…`
}
