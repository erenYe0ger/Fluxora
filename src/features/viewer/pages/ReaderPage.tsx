import { useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePdfDocument } from '../hooks/usePdfDocument'
import { usePdfPages } from '../hooks/usePdfPages'
import { PdfPageView } from '../components/PdfPageView'
import { ThumbnailRail } from '../components/ThumbnailRail'
import { Toolbar } from '../components/Toolbar'
import { useViewerStore } from '../store/viewerStore'
import { useAnnotations } from '@features/annotations'
import { AnnotationsPanel } from '@features/annotations'
import { useDocumentSearch } from '@features/search'
import { HIGHLIGHT_COLORS } from '@features/annotations'
import { useDocumentRecord } from '../hooks/useDocumentRecord'
import { useReaderLayout } from '../hooks/useReaderLayout'
import { useReaderShortcuts } from '../hooks/useReaderShortcuts'
import { EmptyState } from '@shared/ui/EmptyState'
import { Button } from '@shared/ui/Button'

export function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { meta, error: metaError } = useDocumentRecord(id)
  const { doc, numPages, error: pdfError } = usePdfDocument(meta?.data ?? null)
  const { pages } = usePdfPages(doc)
  const annotations = useAnnotations(id)

  const sidebarOpen = useViewerStore((state) => state.sidebarOpen)
  const sidebarTab = useViewerStore((state) => state.sidebarTab)
  const setSidebarTab = useViewerStore((state) => state.setSidebarTab)
  const tool = useViewerStore((state) => state.tool)
  const color = useViewerStore((state) => state.color)
  const scale = useViewerStore((state) => state.scale)
  const currentPage = useViewerStore((state) => state.currentPage)
  const reset = useViewerStore((state) => state.reset)
  const toggleSidebar = useViewerStore((state) => state.toggleSidebar)

  const { containerRef } = useReaderLayout(pages)

  const jumpToPage = useCallback((page: number) => {
    document
      .getElementById(`page-${page}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const search = useDocumentSearch(doc, jumpToPage)
  useReaderShortcuts(jumpToPage, search.clear)

  // Each document starts with a clean viewer state (tool, zoom, page).
  useEffect(() => reset(), [id, reset])

  const exportAnnotations = useCallback(() => {
    const payload = {
      document: meta?.name ?? id,
      exportedAt: new Date().toISOString(),
      annotations: annotations.annotations
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${(meta?.name ?? 'fluxora').replace(/\.pdf$/i, '')}.annotations.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [annotations.annotations, id, meta?.name])

  const failure = metaError ?? pdfError
  if (failure) {
    return (
      <div className="p-6">
        <EmptyState message={failure} />
        <div className="mt-4 text-center">
          <Button onClick={() => navigate('/')}>Back to library</Button>
        </div>
      </div>
    )
  }

  if (!meta) return <EmptyState message="Loading document…" />

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        fileName={meta.name}
        numPages={numPages}
        onBack={() => navigate('/')}
        onJumpToPage={jumpToPage}
        onExport={exportAnnotations}
        search={search}
      />

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <aside className="absolute inset-y-0 left-0 z-30 flex w-40 shrink-0 flex-col border-r border-slate-200 bg-slate-50 shadow-xl md:static md:shadow-none dark:border-slate-800 dark:bg-slate-900">
            <div className="flex border-b border-slate-200 text-xs dark:border-slate-800">
              <button
                type="button"
                className={`flex-1 px-2 py-2 ${
                  sidebarTab === 'thumbnails' ? 'bg-white font-medium dark:bg-slate-800' : ''
                }`}
                onClick={() => setSidebarTab('thumbnails')}
              >
                Pages
              </button>
              <button
                type="button"
                className={`flex-1 px-2 py-2 ${
                  sidebarTab === 'annotations' ? 'bg-white font-medium dark:bg-slate-800' : ''
                }`}
                onClick={() => setSidebarTab('annotations')}
              >
                Notes
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {sidebarTab === 'thumbnails' ? (
                <ThumbnailRail
                  pages={pages}
                  currentPage={currentPage}
                  onSelect={(page) => {
                    jumpToPage(page)
                    // On narrow screens the rail overlays the page, so get out of the way.
                    if (window.innerWidth < 768) toggleSidebar()
                  }}
                />
              ) : (
                <AnnotationsPanel
                  annotations={annotations.annotations}
                  onJump={jumpToPage}
                  onDelete={annotations.removeAnnotation}
                />
              )}
            </div>
          </aside>
        )}

        <main
          ref={containerRef}
          className="min-w-0 flex-1 overflow-auto bg-slate-200 px-4 py-4 dark:bg-slate-950"
        >
          {pages.length === 0 && <EmptyState message="Preparing pages…" />}
          <div className="mx-auto flex w-fit flex-col gap-4">
            {pages.map((page) => {
              const activeMatch =
                search.active && search.active.page === page.pageNumber
                  ? search.active.localIndex
                  : null
              return (
                <PdfPageView
                  key={page.pageNumber}
                  page={page}
                  scale={scale}
                  tool={tool}
                  color={color}
                  annotations={annotations.annotations}
                  searchQuery={search.query}
                  activeMatch={activeMatch}
                  onHighlight={(input) =>
                    annotations.addHighlight({
                      docId: meta.id,
                      page: page.pageNumber,
                      kind: 'highlight',
                      color: HIGHLIGHT_COLORS[color],
                      ...input
                    })
                  }
                  onNote={(input) =>
                    annotations.addNote({
                      docId: meta.id,
                      page: page.pageNumber,
                      kind: 'note',
                      color: HIGHLIGHT_COLORS[color],
                      ...input
                    })
                  }
                  onDeleteAnnotation={annotations.removeAnnotation}
                />
              )
            })}
          </div>
        </main>
      </div>
    </div>
  )
}
