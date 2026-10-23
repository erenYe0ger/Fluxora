import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@shared/ui/Button'
import { IconButton } from '@shared/ui/IconButton'
import { CloseIcon, MoonIcon, SettingsIcon, SunIcon } from '@shared/ui/icons'
import { HIGHLIGHT_PRESETS, useSettingsStore } from '../store'
import type { Theme } from '../store'

type Props = {
  /** Render the trigger inline (header) vs. as a compact icon. */
  compact?: boolean
}

function ThemeChoice({ theme, label, children }: { theme: Theme; label: string; children: ReactNode }) {
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

function Swatch({
  value,
  selected,
  onSelect,
  label
}: {
  value: string
  selected: boolean
  onSelect: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`h-8 w-8 rounded-full border border-black/10 transition duration-150 hover:scale-110 ${
        selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
      }`}
      style={{ backgroundColor: value }}
    />
  )
}

/** Gear button plus its dialog. Self-contained so any screen can drop it in. */
export function SettingsMenu({ compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const theme = useSettingsStore((state) => state.theme)
  const highlightColor = useSettingsStore((state) => state.highlightColor)
  const recentColors = useSettingsStore((state) => state.recentColors)
  const setHighlightColor = useSettingsStore((state) => state.setHighlightColor)
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

  const customColors = recentColors

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
                  <p className="mt-0.5 text-xs text-muted">Applied instantly, stored on this device.</p>
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
                    Default highlight colour
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {HIGHLIGHT_PRESETS.map((preset) => (
                      <Swatch
                        key={preset.value}
                        value={preset.value}
                        label={preset.name}
                        selected={preset.value === highlightColor}
                        onSelect={() => setHighlightColor(preset.value)}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <label className="relative h-9 w-9 shrink-0 cursor-pointer">
                      <input
                        type="color"
                        value={highlightColor}
                        onChange={(event) => setHighlightColor(event.target.value)}
                        aria-label="Pick a custom highlight colour"
                        className="absolute inset-0 cursor-pointer opacity-0"
                      />
                      <span
                        className="pointer-events-none block h-9 w-9 rounded-full border border-line"
                        style={{
                          background:
                            'conic-gradient(#ff8a8a, #ffd166, #8ce7a8, #7cc7ff, #b79bff, #ff8ad8, #ff8a8a)'
                        }}
                      />
                    </label>
                    <div className="min-w-0">
                      <p className="text-xs font-medium">Custom colour</p>
                      <p className="font-mono text-xs text-muted">{highlightColor}</p>
                    </div>
                  </div>

                  {customColors.length > 0 && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs text-muted">Your colours</p>
                      <div className="flex flex-wrap gap-2">
                        {customColors.map((color) => (
                          <Swatch
                            key={color}
                            value={color}
                            label={color}
                            selected={color === highlightColor}
                            onSelect={() => setHighlightColor(color)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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
