import type { ReactNode } from 'react'
import { SparkleIcon } from './icons'

type Props = {
  message: string
  title?: string
  icon?: ReactNode
  children?: ReactNode
}

/** Neutral placeholder for loading, empty and error states. */
export function EmptyState({ message, title, icon, children }: Props) {
  return (
    <div className="animate-fade-in flex h-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-muted">
        {icon ?? <SparkleIcon className="h-5 w-5" />}
      </span>
      {title && <p className="text-sm font-medium text-ink">{title}</p>}
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {children}
    </div>
  )
}
