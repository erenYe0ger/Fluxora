import { useViewerStore } from '../store/viewerStore'
import type { Tool } from '../store/viewerStore'
import { Button } from '@shared/ui/Button'
import { SearchBar } from '@features/search'
import { HIGHLIGHT_COLORS } from '@features/annotations'
import type { HighlightColor } from '@features/annotations'

type Props = {
  fileName: string
  numPages: number
  onBack: () => void
  onJumpToPage: (page: number) => void
  onExport: () => void
  search: {
    query: string
    setQuery: (value: string) => void
    total: number
    activeIndex: number
    searching: boolean
    next: () => void
    previous: () => void
    clear: () => void
  }
}

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: 'select', label: 'Select', hint: 'Select text' },
  { id: 'highlight', label: 'Highlight', hint: 'Select text, then release to highlight' },
  { id: 'note', label: 'Note', hint: 'Click the page to drop a note' }
]

export function Toolbar({ fileName, numPages, onBack, onJumpToPage, onExport, search }: Props) {
  const { scale, tool, color, sidebarOpen, currentPage } = useViewerStore()
  const { setTool, setColor, zoomIn, zoomOut, setScale, setFitMode, toggleSidebar } = useViewerStore()

  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <Button variant="ghost" onClick={onBack} aria-label="Back to library">
        ← Library
      </Button>
      <span className="max-w-48 truncate text-sm font-medium" title={fileName}>
        {fileName}
      </span>

      <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

      <Button variant="ghost" onClick={toggleSidebar} aria-pressed={sidebarOpen} aria-label="Toggle sidebar">
        ☰
      </Button>

      <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

      <nav className="flex items-center gap-1" aria-label="Tools">
        {TOOLS.map((item) => (
          <Button
            key={item.id}
            variant={tool === item.id ? 'primary' : 'ghost'}
            title={item.hint}
            aria-pressed={tool === item.id}
            onClick={() => setTool(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </nav>

      {tool === 'highlight' && (
        <div className="flex items-center gap-1" aria-label="Highlight colour">
          {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((name) => (
            <button
              key={name}
              type="button"
              aria-label={`${name} highlight`}
              aria-pressed={color === name}
              onClick={() => setColor(name)}
              className={`h-5 w-5 rounded-full border ${
                color === name ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-black/10'
              }`}
              style={{ backgroundColor: HIGHLIGHT_COLORS[name] }}
            />
          ))}
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <SearchBar search={search} />

        <div className="flex items-center rounded border border-slate-300 dark:border-slate-700">
          <Button variant="ghost" onClick={zoomOut} aria-label="Zoom out">
            −
          </Button>
          <button
            type="button"
            onClick={() => setScale(1)}
            className="w-14 text-center text-xs"
            title="Reset to 100%"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" onClick={zoomIn} aria-label="Zoom in">
            +
          </Button>
        </div>
        <Button variant="ghost" onClick={() => setFitMode('width')} title="Fit page width">
          Fit width
        </Button>

        <label className="flex items-center gap-1 text-xs">
          Page
          <input
            type="number"
            min={1}
            max={numPages}
            value={currentPage}
            aria-label="Current page"
            className="w-14 rounded border border-slate-300 bg-transparent px-1 py-0.5 text-center dark:border-slate-700"
            onChange={(event) => {
              const page = Number(event.target.value)
              if (page >= 1 && page <= numPages) onJumpToPage(page)
            }}
          />
          <span className="text-slate-500">/ {numPages}</span>
        </label>

        <Button variant="ghost" onClick={onExport} title="Export annotations as JSON">
          Export
        </Button>
      </div>
    </header>
  )
}
