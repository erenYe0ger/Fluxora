import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { CloseIcon, SparkleIcon } from '@shared/ui/icons'

type Props = {
  toolName: string
  toolDescription: string
  icon: ReactNode
  open: boolean
  onClose: () => void
}

export function ComingSoonModal({
  toolName,
  toolDescription,
  icon,
  open,
  onClose
}: Props) {
  const navigate = useNavigate()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      previous?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-fade-in absolute inset-0 bg-black/60 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-pop relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface p-6 shadow-lift outline-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line-strong bg-surface-2 text-accent">
              {icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id={titleId} className="text-base font-semibold text-ink">
                  {toolName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent">
                  <SparkleIcon className="h-3 w-3" />
                  Coming Soon
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">Feature in development</p>
            </div>
          </div>
          <IconButton label="Close" onClick={onClose} size="sm">
            <CloseIcon />
          </IconButton>
        </div>

        <div className="mt-5 space-y-3 text-xs leading-relaxed text-muted">
          <p>{toolDescription}</p>
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 text-xs text-ink">
            <p className="font-medium text-ink">Expanding Fluxora</p>
            <p className="mt-1 text-muted">
              We are working to bring local-first {toolName.toLowerCase()} directly to your browser
              without any external server or file upload.
            </p>
          </div>
          <p>
            In the meantime, you can use the live <strong className="text-ink">PDF Editor</strong> to
            view, annotate, highlight, draw, and markup documents on this device.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Got it
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose()
              navigate('/edit-pdf')
            }}
          >
            Open PDF Editor
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
