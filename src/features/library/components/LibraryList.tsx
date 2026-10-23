import { Link } from 'react-router-dom'
import type { DocumentMeta } from '@shared/lib/documents'
import { formatBytes } from '@shared/lib/format'
import { TrashIcon } from '@shared/ui/icons'
import { IconButton } from '@shared/ui/IconButton'

type Props = {
  docs: DocumentMeta[]
  onRemove: (id: string) => void
}

/** Grid of document cards. Each card links to the reader. */
export function LibraryList({ docs, onRemove }: Props) {
  if (docs.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
        No documents here yet — import a PDF to get started.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {docs.map((doc, index) => (
        <li
          key={doc.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
        >
          <div className="group relative flex h-full flex-col justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
            <Link
              to={`/read/${doc.id}`}
              className="flex items-start gap-3 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
            >
              <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-[10px] font-semibold text-accent">
                PDF
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{doc.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {formatBytes(doc.size)} · {new Date(doc.addedAt).toLocaleDateString()}
                </span>
              </span>
            </Link>

            <div className="flex items-center justify-between">
              <Link
                to={`/read/${doc.id}`}
                className="text-xs font-medium text-accent transition hover:underline"
              >
                Open →
              </Link>
              <IconButton
                label={`Remove ${doc.name}`}
                size="sm"
                className="opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 hover:text-danger"
                onClick={() => onRemove(doc.id)}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
