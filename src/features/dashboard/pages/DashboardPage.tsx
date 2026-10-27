import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SettingsMenu } from '@features/settings'
import { ToolCard } from '../components/ToolCard'
import { ComingSoonModal } from '../components/ComingSoonModal'
import {
  ConvertIcon,
  FileWordIcon,
  MergeIcon,
  PencilIcon
} from '@shared/ui/icons'

type ToolConfig = {
  id: string
  title: string
  description: string
  icon: ReactNode
  status: 'active' | 'coming-soon'
  badge?: string
  to?: string
}

export function DashboardPage() {
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null)

  const tools: ToolConfig[] = [
    {
      id: 'edit-pdf',
      title: 'Edit PDF',
      description:
        'Add annotations, highlights, text notes, shapes, and freehand drawings directly to any PDF.',
      icon: <PencilIcon className="h-6 w-6" />,
      status: 'active',
      badge: 'Ready to Use',
      to: '/edit-pdf'
    },
    {
      id: 'merge-pdf',
      title: 'Merge PDF',
      description:
        'Combine multiple PDF files into a single consolidated document with custom page ordering.',
      icon: <MergeIcon className="h-6 w-6" />,
      status: 'coming-soon',
      badge: 'Coming Soon'
    },
    {
      id: 'pdf-to-word',
      title: 'PDF to Word',
      description:
        'Convert PDF documents into editable Microsoft Word (.docx) files while preserving layout.',
      icon: <FileWordIcon className="h-6 w-6" />,
      status: 'coming-soon',
      badge: 'Coming Soon'
    },
    {
      id: 'word-to-pdf',
      title: 'Word to PDF',
      description:
        'Convert Microsoft Word (.docx) documents into crisp, standardized PDF documents instantly.',
      icon: <ConvertIcon className="h-6 w-6" />,
      status: 'coming-soon',
      badge: 'Coming Soon'
    }
  ]

  return (
    <div className="app-aura min-h-full flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-ink shadow-soft">
              F
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm leading-tight font-semibold tracking-tight text-ink">
                  Fluxora
                </p>
                <span className="rounded bg-accent-soft px-1.5 py-0.2 text-[9px] font-semibold text-accent uppercase tracking-wider">
                  Suite
                </span>
              </div>
              <p className="text-[11px] leading-tight text-muted">Local-first PDF tools</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/edit-pdf"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent/40 hover:bg-surface hover:text-accent"
            >
              <PencilIcon className="h-3.5 w-3.5 text-accent" />
              <span>Open PDF Editor</span>
            </Link>
            <SettingsMenu />
          </div>
        </div>
      </header>

      {/* Main hero & tools dashboard */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10">
        <section className="animate-fade-up max-w-2xl">
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            Browser-First Productivity
          </span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            All your PDF tools, right in your browser
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
            Private, lightning fast, and client-only. Edit, merge, and convert your documents
            without ever uploading your files to any external server.
          </p>
        </section>

        {/* Tools Grid */}
        <section
          className="animate-fade-up grid grid-cols-1 gap-4 sm:grid-cols-2"
          style={{ animationDelay: '80ms' }}
        >
          {tools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              description={tool.description}
              icon={tool.icon}
              status={tool.status}
              badge={tool.badge}
              to={tool.to}
              onClick={() => setSelectedTool(tool)}
            />
          ))}
        </section>

        {/* Feature badges / trust strip */}
        <section
          className="animate-fade-up mt-auto rounded-2xl border border-line bg-surface p-6 shadow-soft"
          style={{ animationDelay: '140ms' }}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">🔒 100% Private & Local</span>
              <p className="text-xs text-muted leading-relaxed">
                Your documents stay inside your browser IndexedDB. Zero bytes are ever sent to an
                external server.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">⚡ Instant Processing</span>
              <p className="text-xs text-muted leading-relaxed">
                Direct client-side PDF rendering powered by modern WebAssembly. Zero upload lag.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink">✈️ Offline Ready</span>
              <p className="text-xs text-muted leading-relaxed">
                Works without an internet connection. Once loaded, Fluxora operates entirely offline.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-6 text-xs text-muted">
          <span>Fluxora · Local-First PDF Suite</span>
          <span className="text-muted/80">No account · No upload · Client-only IndexedDB</span>
        </footer>
      </main>

      {/* Modal for inactive tools */}
      {selectedTool && (
        <ComingSoonModal
          toolName={selectedTool.title}
          toolDescription={selectedTool.description}
          icon={selectedTool.icon}
          open={Boolean(selectedTool)}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  )
}
