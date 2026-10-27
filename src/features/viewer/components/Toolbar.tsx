import { useCallback, useEffect, useRef, useState } from 'react'
import { useViewerStore } from '../store/viewerStore'
import { IconButton } from '@shared/ui/IconButton'
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  MinusIcon,
  PanelIcon,
  PlusIcon,
  UndoIcon
} from '@shared/ui/icons'
import { SearchBar } from '@features/search'
import type { SearchBarState } from '@features/search'
import { SettingsMenu } from '@features/settings'

type Props = {
  fileName: string
  numPages: number
  onBack: () => void
  onJumpToPage: (page: number) => void
  onExport?: () => void
  onExportJson?: () => void
  onExportPdf?: () => void
  onUndo: () => void
  canUndo: boolean
  search: SearchBarState
}

export function Toolbar({
  fileName,
  numPages,
  onBack,
  onJumpToPage,
  onExport,
  onExportJson,
  onExportPdf,
  onUndo,
  canUndo,
  search
}: Props) {
  const [exportOpen, setExportOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const scale = useViewerStore((state) => state.scale)
  const sidebarOpen = useViewerStore((state) => state.sidebarOpen)
  const currentPage = useViewerStore((state) => state.currentPage)
  const toggleSidebar = useViewerStore((state) => state.toggleSidebar)
  const zoomIn = useViewerStore((state) => state.zoomIn)
  const zoomOut = useViewerStore((state) => state.zoomOut)
  const setScale = useViewerStore((state) => state.setScale)

  // Dismiss export menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!exportOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [exportOpen])

  const jump = useCallback(
    (page: number) => {
      if (page >= 1 && page <= numPages) onJumpToPage(page)
    },
    [numPages, onJumpToPage]
  )

  const handleExportJson = () => {
    setExportOpen(false)
    if (onExportJson) {
      onExportJson()
    } else {
      onExport?.()
    }
  }

  const handleExportPdf = () => {
    setExportOpen(false)
    onExportPdf?.()
  }

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

          <div ref={exportMenuRef} className="relative">
            <IconButton
              label="Download options"
              size="sm"
              active={exportOpen}
              onClick={() => setExportOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={exportOpen}
            >
              <DownloadIcon />
            </IconButton>

            {exportOpen && (
              <div
                role="menu"
                aria-label="Download options"
                className="animate-pop absolute right-0 top-full mt-1.5 z-40 w-48 rounded-xl border border-line bg-surface p-1 shadow-lift"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportJson}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition hover:bg-surface-2"
                >
                  <DownloadIcon className="h-4 w-4 text-muted" />
                  <div>
                    <p className="font-medium text-ink">JSON export</p>
                    <p className="text-[10px] text-muted">Annotations data</p>
                  </div>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleExportPdf}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition hover:bg-surface-2"
                >
                  <FileTextIcon className="h-4 w-4 text-muted" />
                  <div>
                    <p className="font-medium text-ink">PDF export</p>
                    <p className="text-[10px] text-muted">With annotations baked in</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <SettingsMenu compact />
        </div>
      </div>
    </header>
  )
}
