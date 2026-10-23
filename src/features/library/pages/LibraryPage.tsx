import { useEffect, useMemo, useState } from 'react'
import { useLibrary } from '../hooks/useLibrary'
import { ImportDropzone } from '../components/ImportDropzone'
import { LibraryList } from '../components/LibraryList'
import { formatBytes } from '@shared/lib/format'
import { SettingsMenu } from '@features/settings'
import { SearchIcon } from '@shared/ui/icons'

export function LibraryPage() {
  const { docs, loading, error, refresh, importFiles, remove } = useLibrary()
  const [filter, setFilter] = useState('')
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null)

  useEffect(() => {
    refresh()
  }, [refresh])

  // Origin quota is advisory: browsers may report 0 or reject the call entirely.
  useEffect(() => {
    navigator.storage
      ?.estimate?.()
      .then((estimate) =>
        setStorage({ usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 })
      )
      .catch(() => setStorage(null))
  }, [docs.length])

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase()
    if (!term) return docs
    return docs.filter((doc) => doc.name.toLowerCase().includes(term))
  }, [docs, filter])

  const totalBytes = docs.reduce((sum, doc) => sum + doc.size, 0)
  const usedPercent =
    storage && storage.quota > 0 ? Math.min(100, (storage.usage / storage.quota) * 100) : 0

  return (
    <div className="app-aura min-h-full">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-ink shadow-soft">
              F
            </span>
            <div>
              <p className="text-sm leading-tight font-semibold tracking-tight">Fluxora</p>
              <p className="text-[11px] leading-tight text-muted">Local-first PDF reader</p>
            </div>
          </div>
          <SettingsMenu />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-6 px-5 py-8">
        <section className="animate-fade-up">
          <h1 className="text-xl font-semibold tracking-tight">Your library</h1>
          <p className="mt-1 text-sm text-muted">
            Read, search and annotate PDFs — all of it happens on this device.
          </p>
        </section>

        <section className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <ImportDropzone onFiles={importFiles} />
        </section>

        {error && (
          <p
            role="alert"
            className="animate-pop rounded-xl border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            {error}
          </p>
        )}

        <section className="animate-fade-up flex flex-col gap-3" style={{ animationDelay: '120ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-medium tracking-wide text-muted uppercase">
              {docs.length} document{docs.length === 1 ? '' : 's'}
            </h2>

            {docs.length > 0 && (
              <div className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface-2 px-2.5 transition focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20">
                <SearchIcon className="h-3.5 w-3.5 text-muted" />
                <input
                  type="search"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter by name"
                  aria-label="Filter by file name"
                  className="w-36 bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none"
                />
              </div>
            )}
          </div>

          {loading && docs.length === 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="animate-shimmer h-24 rounded-xl bg-[linear-gradient(90deg,var(--surface),var(--surface-2),var(--surface))] bg-[length:200%_100%]"
                />
              ))}
            </div>
          ) : (
            <LibraryList docs={visible} onRemove={remove} />
          )}

          {docs.length > 0 && visible.length === 0 && (
            <p className="text-sm text-muted">No documents match “{filter}”.</p>
          )}
        </section>

        <footer className="mt-auto flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              {formatBytes(totalBytes)} of PDFs stored locally
              {storage && storage.quota > 0 && ` · ${formatBytes(storage.quota)} available`}
            </span>
            <span className="text-muted/80">IndexedDB · no account · no upload</span>
          </div>
          {storage && storage.quota > 0 && (
            <div className="h-1 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.max(1, usedPercent)}%` }}
              />
            </div>
          )}
        </footer>
      </main>
    </div>
  )
}
