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
  // While a search is running only the status is worth showing; the controls come back
  // once results are in. Space stays reserved either way, so the toolbar never reflows.
  const showControls = hasQuery && !search.searching
  const status = search.searching
    ? 'Searching…'
    : hasQuery
      ? `${search.total === 0 ? 0 : search.activeIndex + 1}/${search.total}`
      : ''

  return (
    <div className="group flex h-9 w-72 items-center gap-1 rounded-xl border border-line bg-surface-2 pr-1 pl-2.5 transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20">
      <SearchIcon className="h-3.5 w-3.5 shrink-0 text-muted" />
      {/* Fixed footprint: long queries scroll inside the field instead of widening it. */}
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
        className="w-14 shrink-0 pl-1 text-right text-[11px] tabular-nums text-muted"
        aria-live="polite"
      >
        {status}
      </span>

      {/* Reserved space keeps the field width constant while controls appear/disappear. */}
      <span className={`flex w-5 shrink-0 justify-center ${showControls ? '' : 'invisible'}`}>
        <button
          type="button"
          onClick={search.clear}
          disabled={!showControls}
          tabIndex={showControls ? 0 : -1}
          aria-hidden={!showControls}
          aria-label="Clear search"
          className="rounded p-0.5 text-muted transition hover:text-ink"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </span>

      <button
        type="button"
        onClick={search.previous}
        disabled={!showControls || search.total === 0}
        tabIndex={showControls ? 0 : -1}
        aria-hidden={!showControls}
        aria-label="Previous match"
        className={`rounded-md p-1 text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-35 ${
          showControls ? '' : 'invisible'
        }`}
      >
        <ChevronLeftIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={search.next}
        disabled={!showControls || search.total === 0}
        tabIndex={showControls ? 0 : -1}
        aria-hidden={!showControls}
        aria-label="Next match"
        className={`rounded-md p-1 text-muted transition hover:bg-elevated hover:text-ink disabled:opacity-35 ${
          showControls ? '' : 'invisible'
        }`}
      >
        <ChevronRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
