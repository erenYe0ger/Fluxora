// Public surface of the search feature.
export { findMatches, countMatches, excerptAround } from './lib/findMatches'
export type { Match } from './lib/findMatches'
export { buildTextMap, locateMatch } from './lib/textMap'
export { useDocumentSearch } from './hooks/useDocumentSearch'
export { SearchBar } from './components/SearchBar'
export type { SearchBarState } from './components/SearchBar'
