import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: an icon-only control must still be announced. */
  label: string
  active?: boolean
  size?: 'sm' | 'md'
}

const SIZES = { sm: 'h-8 w-8', md: 'h-9 w-9' }

export function IconButton({ label, active = false, size = 'md', className = '', ...props }: Props) {
  const tone = active
    ? 'bg-accent-soft text-accent border-accent/40'
    : 'text-muted border-transparent hover:bg-surface-2 hover:text-ink'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={props['aria-pressed'] ?? active}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border transition duration-150 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-45 ${SIZES[size]} ${tone} ${className}`}
      {...props}
    />
  )
}
