import { useEffect, useRef, useState } from 'react'
import { PlusIcon } from '@shared/ui/icons'
import type { HighlightPreset } from '@features/settings'
import { contrastInk } from '../lib/cursor'

type Props = {
  label: string
  presets: HighlightPreset[]
  value: string
  customColor: string | null
  onChange: (value: string) => void
  onCustomColor: (value: string) => void
}

/**
 * Three preset swatches plus a custom slot. The slot opens the platform colour picker;
 * the picked colour is staged and only applied when the user confirms with OK, so a
 * cancelled pick leaves the current colour untouched.
 */
export function ColorPicker({
  label,
  presets,
  value,
  customColor,
  onChange,
  onCustomColor
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [pending, setPending] = useState<string | null>(null)

  const customActive = customColor !== null && customColor.toLowerCase() === value.toLowerCase()

  // Escape or an outside click drops the staged colour.
  useEffect(() => {
    if (!pending) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setPending(null)
      }
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setPending(null)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [pending])

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
            onClick={() => {
              setPending(null)
              onChange(preset.value)
            }}
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

      <div className="relative">
        {/* Scaling the button scales the tinted disc and the "+" as one unit. */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`Custom ${label.toLowerCase()}`}
          aria-pressed={customActive}
          title={customColor ? `Custom colour ${customColor}` : 'Pick a custom colour'}
          className={`relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border transition duration-150 hover:scale-110 ${
            customActive
              ? 'border-black/10 ring-2 ring-accent ring-offset-2 ring-offset-surface'
              : 'border-dashed border-line-strong'
          }`}
        >
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: customColor
                ? customColor
                : 'conic-gradient(#ff8a8a, #ffd166, #8ce7a8, #7cc7ff, #b79bff, #ff8ad8, #ff8a8a)'
            }}
          />
          {/* Always present: it is what marks this circle as the custom slot. */}
          <span
            className="relative"
            style={{ color: customColor ? contrastInk(customColor) : '#0a0c11' }}
          >
            <PlusIcon className="h-3 w-3" />
          </span>
        </button>

        {/* Native picker; its change only stages the colour — OK is the real commit. */}
        <input
          ref={inputRef}
          type="color"
          value={customColor ?? value}
          onChange={(event) => setPending(event.target.value)}
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
        />

        {pending && (
          <div className="animate-pop absolute top-8 right-0 z-40 w-44 rounded-xl border border-line bg-surface p-2.5 shadow-lift">
            <div className="flex items-center gap-2">
              <span
                className="h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: pending }}
              />
              <span className="font-mono text-[11px] text-muted">{pending}</span>
            </div>
            <div className="mt-2.5 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-md px-2 py-1 text-[11px] font-medium text-danger transition hover:bg-danger-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onCustomColor(pending)
                  setPending(null)
                }}
                className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-ink transition hover:brightness-110"
              >
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
