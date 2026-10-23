import type { PDFPageProxy } from 'pdfjs-dist'
import { PageThumbnail } from './PageThumbnail'

type Props = {
  pages: PDFPageProxy[]
  currentPage: number
  onSelect: (page: number) => void
}

export function ThumbnailRail({ pages, currentPage, onSelect }: Props) {
  if (pages.length === 0) {
    return <p className="p-3 text-xs text-slate-500">Loading pages…</p>
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {pages.map((page) => (
        <PageThumbnail
          key={page.pageNumber}
          page={page}
          width={112}
          active={page.pageNumber === currentPage}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
