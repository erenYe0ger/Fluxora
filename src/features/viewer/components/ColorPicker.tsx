import { useRef } from 'react'
import { PlusIcon } from '@shared/ui/icons'
import type { HighlightPreset } from '@features/settings'

type Props = {
  label: string
  presets: HighlightPreset[]
  value: string
  customColor: string | null
  onChange: (value: string) => void
  onCustomColor: (value: string) => void
}

/**
 * Three preset swatches plus a custom slot. The custom slot opens the platform colour
 * picker directly (no intermediate popover): once the user confirms, that colour fills
 * the fourth circle and becomes the active one.
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
  const customActive = customColor !== null && customColor.toLowerCase() === value.toLowerCase()

  return (
    <div className="animate-fade-in flex items-center gap-1.5 pl-1" aria-label={label}>
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

      <div className="relative">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={`Custom ${label.toLowerCase()}`}
          aria-pressed={customActive}
          title={customColor ? `Custom colour ${customColor}` : 'Pick a custom colour'}
          className={`flex h-6 w-6 items-center justify-center rounded-full border border-black/10 transition duration-150 hover:scale-110 ${
            customActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
          } ${customColor ? '' : 'border-line'}`}
          style={
            customColor
              ? { backgroundColor: customColor }
              : {
                  background:
                    'conic-gradient(#ff8a8a, #ffd166, #8ce7a8, #7cc7ff, #b79bff, #ff8ad8, #ff8a8a)'
                }
          }
        >
          {!customColor && <PlusIcon className="h-3 w-3 text-black/60" />}
        </button>

        {/* Native picker, anchored under the button; only its `change` (confirmed) commit. */}
        <input
          ref={inputRef}
          type="color"
          value={customColor ?? value}
          onChange={(event) => onCustomColor(event.target.value)}
          aria-hidden
          tabIndex={-1}
          className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
        />
      </div>
    </div>
  )
}
