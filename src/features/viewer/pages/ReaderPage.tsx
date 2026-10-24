import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePdfDocument } from '../hooks/usePdfDocument'
import { usePdfPages } from '../hooks/usePdfPages'
import { PdfPageView } from '../components/PdfPageView'
import { ThumbnailRail } from '../components/ThumbnailRail'
import { Toolbar } from '../components/Toolbar'
import { AnnotationToolbar } from '../components/AnnotationToolbar'
import { useViewerStore } from '../store/viewerStore'
import { useDocumentRecord } from '../hooks/useDocumentRecord'
import { useReaderLayout } from '../hooks/useReaderLayout'
import { useReaderShortcuts } from '../hooks/useReaderShortcuts'
import { AnnotationsPanel, useAnnotations } from '@features/annotations'
import { useDocumentSearch } from '@features/search'
import { useSettingsStore } from '@features/settings'
import { Button } from '@shared/ui/Button'
import { EmptyState } from '@shared/ui/EmptyState'
import { FileTextIcon } from '@shared/ui/icons'

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
  const scale = useViewerStore((state) => state.scale)
  const currentPage = useViewerStore((state) => state.currentPage)
  const reset = useViewerStore((state) => state.reset)
  const toggleSidebar = useViewerStore((state) => state.toggleSidebar)

  // Colors
  const highlightColor = useSettingsStore((state) => state.highlightColor)
  const noteColor = useSettingsStore((state) => state.noteColor)
  const drawColor = useSettingsStore((state) => state.drawColor)
  const drawThickness = useSettingsStore((state) => state.drawThickness)
  const setDrawColor = useSettingsStore((state) => state.setDrawColor)
  const setDrawThickness = useSettingsStore((state) => state.setDrawThickness)
  const textColor = useSettingsStore((state) => state.textColor)
  const textFontFamily = useSettingsStore((state) => state.textFontFamily)
  const textFontSize = useSettingsStore((state) => state.textFontSize)
  const textBold = useSettingsStore((state) => state.textBold)
  const textItalic = useSettingsStore((state) => state.textItalic)
  const textUnderline = useSettingsStore((state) => state.textUnderline)
  const setTextColor = useSettingsStore((state) => state.setTextColor)
  const setTextFontFamily = useSettingsStore((state) => state.setTextFontFamily)
  const setTextFontSize = useSettingsStore((state) => state.setTextFontSize)
  const setTextBold = useSettingsStore((state) => state.setTextBold)
  const setTextItalic = useSettingsStore((state) => state.setTextItalic)
  const setTextUnderline = useSettingsStore((state) => state.setTextUnderline)

  const { containerRef } = useReaderLayout(pages)

  const jumpToPage = useCallback((page: number) => {
    document
      .getElementById(`page-${page}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const search = useDocumentSearch(doc, jumpToPage)
  const undo = annotations.undo
  useReaderShortcuts(jumpToPage, search.clear, undo)

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
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="This document could not be opened"
          message={failure}
          icon={<FileTextIcon className="h-5 w-5" />}
        >
          <Button variant="secondary" onClick={() => navigate('/')}>
            Back to library
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-bg">
      <Toolbar
        fileName={meta?.name ?? 'Loading…'}
        numPages={numPages}
        onBack={() => navigate('/')}
        onJumpToPage={jumpToPage}
        onExport={exportAnnotations}
        onUndo={undo}
        canUndo={annotations.canUndo}
        search={search}
      />

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <aside className="animate-slide-in absolute inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col border-r border-line bg-surface md:static">
            <div className="flex gap-1 border-b border-line p-1.5">
              {(
                [
                  ['thumbnails', 'Pages'],
                  ['annotations', `Notes ${annotations.annotations.length || ''}`.trim()]
                ] as const
              ).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSidebarTab(tab)}
                  aria-pressed={sidebarTab === tab}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition duration-150 ${
                    sidebarTab === tab
                      ? 'bg-surface-2 text-ink shadow-soft'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
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
          className="min-w-0 flex-1 overflow-auto bg-bg px-4 pt-4 pb-6 md:px-6 md:pt-5 md:pb-7"
        >
          {pages.length === 0 && (
            <EmptyState title="Preparing pages" message="Laying out the document…" />
          )}

          <div className="mx-auto flex w-fit flex-col items-center gap-5">
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
                  highlightColor={highlightColor}
                  drawColor={drawColor}
                  drawThickness={drawThickness}
                  textColor={textColor}
                  textFontFamily={textFontFamily}
                  textFontSize={textFontSize}
                  textBold={textBold}
                  textItalic={textItalic}
                  textUnderline={textUnderline}
                  annotations={annotations.annotations}
                  searchQuery={search.query}
                  activeMatch={activeMatch}
                  onHighlight={(input) =>
                    annotations.addHighlight({
                      docId: meta?.id ?? '',
                      page: page.pageNumber,
                      kind: 'highlight',
                      color: highlightColor,
                      ...input
                    })
                  }
                  onNote={(input) =>
                    annotations.addNote({
                      docId: meta?.id ?? '',
                      page: page.pageNumber,
                      kind: 'note',
                      color: noteColor,
                      ...input
                    })
                  }
                  onDraw={(input) =>
                    annotations.addDraw({
                      docId: meta?.id ?? '',
                      page: page.pageNumber,
                      kind: 'draw',
                      ...input
                    })
                  }
                  onText={(input) =>
                    annotations.addText({
                      docId: meta?.id ?? '',
                      page: page.pageNumber,
                      kind: 'text',
                      ...input
                    })
                  }
                  onDeleteAnnotation={annotations.removeAnnotation}
                  onMoveAnnotation={annotations.moveAnnotation}
                  onEditText={annotations.updateTextAnnotation}
                />
              )
            })}
          </div>
        </main>

        {/* Right sidebar with annotation tools */}
        <AnnotationToolbar
          onDrawColorChange={setDrawColor}
          onDrawThicknessChange={setDrawThickness}
          drawColor={drawColor}
          drawThickness={drawThickness}
          onTextColorChange={setTextColor}
          onTextFontFamilyChange={setTextFontFamily}
          onTextFontSizeChange={setTextFontSize}
          onTextBoldChange={setTextBold}
          onTextItalicChange={setTextItalic}
          onTextUnderlineChange={setTextUnderline}
          textColor={textColor}
          textFontFamily={textFontFamily}
          textFontSize={textFontSize}
          textBold={textBold}
          textItalic={textItalic}
          textUnderline={textUnderline}
        />
      </div>
    </div>
  )
}