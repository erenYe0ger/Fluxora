import type { PDFPageProxy } from 'pdfjs-dist'
import { PageThumbnail } from './PageThumbnail'

type Props = {
  pages: PDFPageProxy[]
  currentPage: number
  onSelect: (page: number) => void
}

export function ThumbnailRail({ pages, currentPage, onSelect }: Props) {
  if (pages.length === 0) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="animate-shimmer h-24 rounded-lg bg-[linear-gradient(90deg,var(--surface-2),var(--elevated),var(--surface-2))] bg-[length:200%_100%]"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {pages.map((page) => (
        <PageThumbnail
          key={page.pageNumber}
          page={page}
          width={104}
          active={page.pageNumber === currentPage}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
