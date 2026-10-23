import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-ink shadow-soft hover:brightness-110 active:brightness-95 border border-transparent',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-elevated',
  ghost: 'text-muted border border-transparent hover:text-ink hover:bg-surface-2',
  danger: 'text-danger border border-transparent hover:bg-danger-soft'
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm'
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: Props) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  )
}
