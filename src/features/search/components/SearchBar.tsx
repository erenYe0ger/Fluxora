import { useEffect, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, SearchIcon } from '@shared/ui/icons'

export type SearchBarState = {
  query: string
  setQuery: (value: string) => void
  total: number
  activeIndex: number
  searching: boolean
  next: () => void
  previous: () => void
  clear: () => void
}

type Props = {
  search: SearchBarState
}

/** Find-in-document control; Ctrl/Cmd+F focuses it instead of the browser's finder. */
export function SearchBar({ search }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const hasQuery = search.query.trim().length > 0
  const status = search.searching
    ? 'Searching…'
    : hasQuery
      ? `${search.total === 0 ? 0 : search.activeIndex + 1}/${search.total}`
      : ''

  return (
    <div className="group flex h-9 w-64 items-center gap-1 rounded-xl border border-line bg-surface-2 pr-1 pl-2.5 transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20">
      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
      {/* Fixed footprint: the field keeps its width while typing, so long queries scroll
          inside the box instead of stretching the toolbar onto a new line. */}
      <input
        ref={inputRef}
        type="search"
        value={search.query}
        placeholder="Find in document"
        aria-label="Find in document"
        className="min-w-0 flex-1 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none"
        onChange={(event) => search.setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            if (event.shiftKey) search.previous()
            else search.next()
          }
          if (event.key === 'Escape') search.clear()
        }}
      />

      <span
        className="w-10 shrink-0 text-right text-[11px] tabular-nums text-muted"
        aria-live="polite"
      >
        {status}
      </span>

      <span className="flex w-4 shrink-0 items-center justify-center">
        {hasQuery && (
          <button
            type="button"
            onClick={search.clear}
            aria-label="Clear search"
            className="rounded p-0.5 text-muted transition hover:text-ink"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </span>

      <button
        type="button"
        onClick={search.previous}
        disabled={search.total === 0}
        aria-label="Previous match"
        className="rounded-md p-1 text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-35"
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={search.next}
        disabled={search.total === 0}
        aria-label="Next match"
        className="rounded-md p-1 text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-35"
      >
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
