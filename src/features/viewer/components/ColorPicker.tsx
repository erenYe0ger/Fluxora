import { useEffect, useRef, useState } from 'react'
import { PlusIcon } from '@shared/ui/icons'
import type { HighlightPreset } from '@features/settings'

type Props = {
  label: string
  presets: HighlightPreset[]
  value: string
  onChange: (value: string) => void
  recentColors: string[]
}

/**
 * Inline colour switcher for whichever annotation tool is active: presets in one row,
 * plus a popover with the full picker and recently used custom colours.
 */
export function ColorPicker({ label, presets, value, onChange, recentColors }: Props) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const isPreset = (color: string) =>
    presets.some((preset) => preset.value.toLowerCase() === color.toLowerCase())
  const customColors = recentColors.filter((color) => !isPreset(color))

  return (
    <div
      ref={wrapperRef}
      className="animate-fade-in relative flex items-center gap-1.5 pl-1"
      aria-label={label}
    >
      {presets.map((preset) => {
        const active = preset.value.toLowerCase() === value.toLowerCase()
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            aria-label={preset.name}
            aria-pressed={active}
            title={preset.name}
            className={`h-6 w-6 rounded-full border border-black/10 transition duration-150 hover:scale-110 ${
              active ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
            }`}
            style={{ backgroundColor: preset.value }}
          />
        )
      })}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Custom ${label.toLowerCase()}`}
        aria-expanded={open}
        title="Custom colour"
        className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-muted transition hover:scale-110 hover:text-ink"
        style={{
          background:
            'conic-gradient(#ff8a8a, #ffd166, #8ce7a8, #7cc7ff, #b79bff, #ff8ad8, #ff8a8a)'
        }}
      >
        <PlusIcon className="h-3.5 w-3.5 text-black/60" />
      </button>

      {open && (
        <div className="animate-pop absolute top-9 left-0 z-40 w-60 rounded-xl border border-line bg-surface p-3 shadow-lift">
          <p className="mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">
            {label}
          </p>
          <label className="flex items-center gap-2">
            <input
              type="color"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-label={`Pick a colour for ${label.toLowerCase()}`}
              className="h-9 w-12 cursor-pointer rounded-md border border-line bg-surface-2"
            />
            <span className="font-mono text-xs text-muted">{value}</span>
          </label>

          {customColors.length > 0 && (
            <>
              <p className="mt-3 mb-2 text-[11px] font-medium tracking-wide text-muted uppercase">
                Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {customColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    aria-label={`Use ${color}`}
                    title={color}
                    className="h-6 w-6 rounded-full border border-black/10 transition hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
