import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  const base =
    'inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-500'
      : 'bg-transparent text-inherit hover:bg-slate-200/60 dark:hover:bg-slate-800'
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
