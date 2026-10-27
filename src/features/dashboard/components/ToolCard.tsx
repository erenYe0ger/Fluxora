import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SparkleIcon } from '@shared/ui/icons'

type Props = {
  title: string
  description: string
  icon: ReactNode
  status: 'active' | 'coming-soon'
  badge?: string
  to?: string
  onClick?: () => void
}

export function ToolCard({
  title,
  description,
  icon,
  status,
  badge,
  to,
  onClick
}: Props) {
  const isActive = status === 'active'

  const content = (
    <div
      className={`group relative flex h-full flex-col justify-between rounded-2xl border p-6 text-left transition duration-200 ${
        isActive
          ? 'border-line bg-surface hover:-translate-y-1 hover:border-accent/60 hover:shadow-lift'
          : 'border-line/70 bg-surface/70 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-soft'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-xl border transition duration-200 ${
              isActive
                ? 'border-accent/30 bg-accent-soft text-accent group-hover:scale-105'
                : 'border-line bg-surface-2 text-muted group-hover:text-ink'
            }`}
          >
            {icon}
          </span>
          {badge && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition ${
                isActive
                  ? 'bg-accent text-accent-ink shadow-soft'
                  : 'bg-surface-2 text-muted border border-line'
              }`}
            >
              {!isActive && <SparkleIcon className="h-3 w-3" />}
              {badge}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-base font-semibold text-ink group-hover:text-accent transition">
          {title}
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{description}</p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4 text-xs font-medium">
        <span
          className={`transition ${
            isActive ? 'text-accent group-hover:underline' : 'text-muted'
          }`}
        >
          {isActive ? 'Open Tool →' : 'Learn more'}
        </span>
        <span className="text-[11px] text-muted/70">
          {isActive ? '100% in-browser' : 'Planned'}
        </span>
      </div>
    </div>
  )

  if (isActive && to) {
    return (
      <Link
        to={to}
        className="block h-full focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
        aria-label={`${title} - ${description}`}
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full w-full cursor-pointer text-left focus-visible:rounded-2xl focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none"
      aria-label={`${title} (${badge ?? 'Tool'}) - Click to view status`}
    >
      {content}
    </button>
  )
}
