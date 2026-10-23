import { useEffect, useMemo, useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { ImportDropzone } from '../components/ImportDropzone'
import { LibraryList } from '../components/LibraryList'
import { formatBytes } from '@shared/lib/format'

export function LibraryPage() {
  const { docs, loading, error, refresh, importFiles, remove } = useLibrary()
  const [filter, setFilter] = useState('')
  const [storageUsed, setStorageUsed] = useState<number | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  // Origin quota is advisory: browsers may report 0 or reject the call entirely.
  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((estimate) => setStorageUsed(estimate.usage ?? null))
      .catch(() => setStorageUsed(null))
  }, [docs.length])

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase()
    if (!term) return docs
    return docs.filter((doc) => doc.name.toLowerCase().includes(term))
  }, [docs, filter])

  const totalBytes = docs.reduce((sum, doc) => sum + doc.size, 0)

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Fluxora</h1>
        <p className="text-sm text-slate-500">
          Read, search and annotate PDFs. Everything stays in this browser.
        </p>
      </header>

      <ImportDropzone onFiles={importFiles} />

      {error && (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-medium">Your documents</h2>
          <span className="text-xs text-slate-500">
            {docs.length} file{docs.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
            {storageUsed !== null && ` · ${formatBytes(storageUsed)} browser storage`}
          </span>
        </div>

        {docs.length > 0 && (
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by file name"
            aria-label="Filter by file name"
            className="w-full rounded border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-700"
          />
        )}

        {loading && docs.length === 0 ? (
          <p className="text-sm text-slate-500">Loading library…</p>
        ) : (
          <LibraryList docs={visible} onRemove={remove} />
        )}

        {docs.length > 0 && visible.length === 0 && (
          <p className="text-sm text-slate-500">No documents match “{filter}”.</p>
        )}
      </section>

      <footer className="mt-auto pt-6 text-xs text-slate-400">
        Files are stored locally in IndexedDB and never uploaded.
      </footer>
    </div>
  )
}
