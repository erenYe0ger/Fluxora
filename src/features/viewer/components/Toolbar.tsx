import type { ReactNode } from 'react'
import { useCallback } from 'react'
import { useViewerStore } from '../store/viewerStore'
import type { Tool } from '../store/viewerStore'
import { IconButton } from '@shared/ui/IconButton'
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CursorIcon,
  DownloadIcon,
  HighlighterIcon,
  MinusIcon,
  NoteIcon,
  PanelIcon,
  PlusIcon,
  UndoIcon
} from '@shared/ui/icons'
import { SearchBar } from '@features/search'
import type { SearchBarState } from '@features/search'
import {
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  SettingsMenu,
  useSettingsStore
} from '@features/settings'
import { ColorPicker } from './ColorPicker'

type Props = {
  fileName: string
  numPages: number
  onBack: () => void
  onJumpToPage: (page: number) => void
  onExport: () => void
  onUndo: () => void
  canUndo: boolean
  search: SearchBarState
}

const TOOLS: { id: Tool; label: string; hint: string; icon: ReactNode }[] = [
  { id: 'select', label: 'Select', hint: 'Select text (V)', icon: <CursorIcon /> },
  {
    id: 'highlight',
    label: 'Highlight',
    hint: 'Select text to highlight (H)',
    icon: <HighlighterIcon />
  },
  { id: 'note', label: 'Note', hint: 'Click the page to add a note (N)', icon: <NoteIcon /> }
]

export function Toolbar({
  fileName,
  numPages,
  onBack,
  onJumpToPage,
  onExport,
  onUndo,
  canUndo,
  search
}: Props) {
  const scale = useViewerStore((state) => state.scale)
  const tool = useViewerStore((state) => state.tool)
  const sidebarOpen = useViewerStore((state) => state.sidebarOpen)
  const currentPage = useViewerStore((state) => state.currentPage)
  const setTool = useViewerStore((state) => state.setTool)
  const toggleSidebar = useViewerStore((state) => state.toggleSidebar)
  const zoomIn = useViewerStore((state) => state.zoomIn)
  const zoomOut = useViewerStore((state) => state.zoomOut)
  const setScale = useViewerStore((state) => state.setScale)

  const highlightColor = useSettingsStore((state) => state.highlightColor)
  const noteColor = useSettingsStore((state) => state.noteColor)
  const customHighlightColor = useSettingsStore((state) => state.customHighlightColor)
  const customNoteColor = useSettingsStore((state) => state.customNoteColor)
  const setHighlightColor = useSettingsStore((state) => state.setHighlightColor)
  const setNoteColor = useSettingsStore((state) => state.setNoteColor)
  const setCustomHighlightColor = useSettingsStore((state) => state.setCustomHighlightColor)
  const setCustomNoteColor = useSettingsStore((state) => state.setCustomNoteColor)

  const jump = useCallback(
    (page: number) => {
      if (page >= 1 && page <= numPages) onJumpToPage(page)
    },
    [numPages, onJumpToPage]
  )

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <IconButton label="Back to library" onClick={onBack} size="sm">
          <ArrowLeftIcon />
        </IconButton>
        <IconButton
          label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          active={sidebarOpen}
          onClick={toggleSidebar}
          size="sm"
        >
          <PanelIcon />
        </IconButton>

        <div className="ml-1 hidden min-w-0 sm:block">
          <p className="max-w-52 truncate text-sm font-medium" title={fileName}>
            {fileName}
          </p>
          <p className="text-[11px] text-muted">
            Page {currentPage} of {numPages}
          </p>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <div className="flex items-center gap-1">
          <IconButton label="Previous page" size="sm" onClick={() => jump(currentPage - 1)}>
            <ChevronLeftIcon />
          </IconButton>
          <label className="flex items-center gap-1 text-xs text-muted">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              aria-label="Go to page"
              onChange={(event) => jump(Number(event.target.value))}
              className="h-8 w-12 rounded-md border border-line bg-surface-2 px-1 text-center text-ink transition focus:border-accent/60 focus:ring-2 focus:ring-accent/25 focus:outline-none"
            />
            <span className="whitespace-nowrap">/ {numPages}</span>
          </label>
          <IconButton label="Next page" size="sm" onClick={() => jump(currentPage + 1)}>
            <ChevronRightIcon />
          </IconButton>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-line md:block" />

        <div
          role="toolbar"
          aria-label="Annotation tools"
          className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1"
        >
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTool(item.id)}
              aria-pressed={tool === item.id}
              title={item.hint}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition duration-150 ${
                tool === item.id
                  ? 'bg-accent text-accent-ink shadow-soft'
                  : 'text-muted hover:bg-elevated hover:text-ink'
              }`}
            >
              {item.icon}
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Colour belongs to the active tool, and each tool keeps its own. */}
        {tool === 'highlight' && (
          <ColorPicker
            label="Highlight colour"
            presets={HIGHLIGHT_PRESETS}
            value={highlightColor}
            customColor={customHighlightColor}
            onChange={setHighlightColor}
            onCustomColor={setCustomHighlightColor}
          />
        )}
        {tool === 'note' && (
          <ColorPicker
            label="Note colour"
            presets={NOTE_PRESETS}
            value={noteColor}
            customColor={customNoteColor}
            onChange={setNoteColor}
            onCustomColor={setCustomNoteColor}
          />
        )}

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <SearchBar search={search} />

          <div className="flex items-center rounded-xl border border-line bg-surface-2 p-1">
            <IconButton label="Zoom out" size="sm" onClick={zoomOut}>
              <MinusIcon />
            </IconButton>
            <button
              type="button"
              onClick={() => setScale(1)}
              title="Reset to 100%"
              className="h-8 w-14 rounded-md text-xs font-medium text-muted transition hover:bg-elevated hover:text-ink"
            >
              {Math.round(scale * 100)}%
            </button>
            <IconButton label="Zoom in" size="sm" onClick={zoomIn}>
              <PlusIcon />
            </IconButton>
          </div>

          <IconButton
            label="Undo last annotation (Ctrl+Z)"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <UndoIcon />
          </IconButton>

          <IconButton label="Export annotations as JSON" size="sm" onClick={onExport}>
            <DownloadIcon />
          </IconButton>
          <SettingsMenu compact />
        </div>
      </div>
    </header>
  )
}
