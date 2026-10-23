import { useEffect, useRef } from 'react'
import { Button } from '@shared/ui/Button'

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

export function SearchBar({ search }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl/Cmd+F focuses search instead of the browser's own find widget.
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

  const status = search.searching
    ? 'Searching…'
    : search.query.trim()
      ? `${search.total === 0 ? 0 : search.activeIndex + 1}/${search.total}`
      : ''

  return (
    <div className="flex items-center gap-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-700">
      <input
        ref={inputRef}
        type="search"
        value={search.query}
        placeholder="Find in document"
        aria-label="Find in document"
        className="w-36 bg-transparent text-sm outline-none"
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
      <span className="min-w-16 text-right text-xs text-slate-500" aria-live="polite">
        {status}
      </span>
      <Button
        variant="ghost"
        onClick={search.previous}
        disabled={search.total === 0}
        aria-label="Previous match"
      >
        ↑
      </Button>
      <Button
        variant="ghost"
        onClick={search.next}
        disabled={search.total === 0}
        aria-label="Next match"
      >
        ↓
      </Button>
    </div>
  )
}
