import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { CloseIcon, MoonIcon, SettingsIcon, SunIcon } from '@shared/ui/icons'
import { useSettingsStore } from '../store'
import type { Theme } from '../store'

type Props = {
  /** Render the trigger inline (header) vs. as a compact icon. */
  compact?: boolean
}

function ThemeChoice({
  theme,
  label,
  children
}: {
  theme: Theme
  label: string
  children: ReactNode
}) {
  const current = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const active = current === theme

  return (
    <button
      type="button"
      onClick={() => setTheme(theme)}
      aria-pressed={active}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition duration-150 ${
        active
          ? 'border-accent/50 bg-accent-soft text-ink shadow-soft'
          : 'border-line bg-surface-2 text-muted hover:border-line-strong hover:text-ink'
      }`}
    >
      {children}
      {label}
    </button>
  )
}

/**
 * Gear button plus its dialog. Colours are deliberately *not* here: they are part of
 * the annotation workflow and live in the reader toolbar, next to the tool that uses them.
 */
export function SettingsMenu({ compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  const reset = useSettingsStore((state) => state.reset)

  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes; the dialog takes focus and hands it back on close.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    panelRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      previous?.focus()
    }
  }, [open])

  return (
    <>
      {compact ? (
        <IconButton label="Settings" onClick={() => setOpen(true)}>
          <SettingsIcon />
        </IconButton>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          <SettingsIcon />
          Settings
        </Button>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="animate-fade-in absolute inset-0 bg-black/55 backdrop-blur-[3px]"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              className="animate-pop relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-lift outline-none"
            >
              <header className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h2 id={titleId} className="text-sm font-semibold">
                    Settings
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Applied instantly, stored on this device.
                  </p>
                </div>
                <IconButton label="Close settings" onClick={() => setOpen(false)} size="sm">
                  <CloseIcon />
                </IconButton>
              </header>

              <div className="space-y-6 px-5 py-5">
                <section>
                  <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                    Appearance
                  </h3>
                  <div className="flex gap-2">
                    <ThemeChoice theme="dark" label="Dark">
                      <MoonIcon />
                    </ThemeChoice>
                    <ThemeChoice theme="light" label="Light">
                      <SunIcon />
                    </ThemeChoice>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    Currently {theme}. Dark is the default and easier on the eyes for long reads.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-xs font-medium tracking-wide text-muted uppercase">
                    Annotations
                  </h3>
                  <p className="text-xs leading-relaxed text-muted">
                    Highlight and note colours are chosen in the reader, from the toolbar next to the
                    tool you are using. <span className="text-ink">Ctrl/⌘ + Z</span> undoes the last
                    annotation.
                  </p>
                </section>
              </div>

              <footer className="flex items-center justify-between border-t border-line bg-surface-2 px-5 py-3">
                <Button size="sm" variant="danger" onClick={reset}>
                  Reset to defaults
                </Button>
                <Button size="sm" variant="primary" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </footer>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
