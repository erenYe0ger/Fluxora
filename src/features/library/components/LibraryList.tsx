import { Link } from 'react-router-dom'
import type { DocumentMeta } from '@shared/lib/documents'
import { formatBytes } from '@shared/lib/format'
import { Button } from '@shared/ui/Button'

type Props = {
  docs: DocumentMeta[]
  onRemove: (id: string) => void
}

export function LibraryList({ docs, onRemove }: Props) {
  if (docs.length === 0) {
    return <p className="text-sm text-slate-500">No documents yet. Import a PDF to get started.</p>
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {docs.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <Link to={`/read/${doc.id}`} className="truncate font-medium hover:underline">
              {doc.name}
            </Link>
            <p className="text-xs text-slate-500">
              {formatBytes(doc.size)} · {new Date(doc.addedAt).toLocaleString()}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => onRemove(doc.id)}
            aria-label={`Remove ${doc.name}`}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  )
}
