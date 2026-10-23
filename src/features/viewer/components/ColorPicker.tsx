import { useEffect, useRef, useState } from 'react'
import { PlusIcon } from '@shared/ui/icons'
import type { HighlightPreset } from '@features/settings'
import { RAINBOW, hexToHsv, hsvToHex } from '../lib/color'

type Props = {
  label: string
  presets: HighlightPreset[]
  value: string
  customColor: string | null
  onChange: (value: string) => void
  onCustomColor: (value: string) => void
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/**
 * Three preset swatches plus a custom slot. The slot always wears a rainbow face so it reads
 * as "pick anything", and it opens a small picker (saturation/value square + hue slider) whose
 * OK/Cancel live inside that same panel: nothing is applied until OK.
 */
export function ColorPicker({ label, presets, value, customColor, onChange, onCustomColor }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const squareRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(customColor ?? value))
  const draft = hsvToHex(hsv.h, hsv.s, hsv.v)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  const pickFromPointer = (clientX: number, clientY: number) => {
    const bounds = squareRef.current?.getBoundingClientRect()
    if (!bounds) return
    const s = clamp01((clientX - bounds.left) / bounds.width)
    const v = 1 - clamp01((clientY - bounds.top) / bounds.height)
    setHsv((current) => ({ ...current, s, v }))
  }

  const startTracking = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    pickFromPointer(event.clientX, event.clientY)
    const track = (pointer: PointerEvent) => pickFromPointer(pointer.clientX, pointer.clientY)
    const release = () => {
      window.removeEventListener('pointermove', track)
      window.removeEventListener('pointerup', release)
    }
    window.addEventListener('pointermove', track)
    window.addEventListener('pointerup', release)
  }

  const customActive = customColor !== null && customColor.toLowerCase() === value.toLowerCase()
  // Pure hue at full saturation, used as the right edge of the saturation square.
  const hueEdge = hsvToHex(hsv.h, 1, 1)

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
              setOpen(false)
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
        {/* No transform on hover: scaling the disc made the gradient hazy and grew the "+". */}
        <button
          type="button"
          onClick={() => {
            setHsv(hexToHsv(customColor ?? value))
            setOpen((current) => !current)
          }}
          aria-label={`Custom ${label.toLowerCase()}`}
          aria-pressed={customActive}
          aria-expanded={open}
          title="Pick a custom colour"
          className={`relative flex h-6 w-6 items-center justify-center rounded-full border border-black/10 transition-shadow duration-150 hover:ring-2 hover:ring-accent/60 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
            customActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
          }`}
        >
          <span aria-hidden className="absolute inset-0 rounded-full" style={{ background: RAINBOW }} />
          {/* Always present: it is what marks this circle as the custom slot. */}
          <PlusIcon className="relative h-3 w-3 text-black/75" />
        </button>

        {open && (
          <div
            role="group"
            aria-label={`${label} colour`}
            className="animate-pop absolute top-8 right-0 z-40 w-52 rounded-xl border border-line bg-surface p-2.5 shadow-lift"
          >
            <div
              ref={squareRef}
              onPointerDown={startTracking}
              className="relative h-24 w-full cursor-crosshair rounded-lg border border-black/10"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueEdge})`
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                style={{
                  left: `${hsv.s * 100}%`,
                  top: `${(1 - hsv.v) * 100}%`,
                  backgroundColor: draft
                }}
              />
            </div>

            <input
              type="range"
              min={0}
              max={359}
              value={Math.round(hsv.h)}
              onChange={(event) => setHsv((current) => ({ ...current, h: Number(event.target.value) }))}
              aria-label={`${label} hue`}
              className="hue-slider mt-2.5 w-full"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span
                  className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: draft }}
                />
                <span className="truncate font-mono text-[11px] text-muted">{draft}</span>
              </span>
              <span className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-[11px] font-medium text-danger transition hover:bg-danger-soft"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCustomColor(draft)
                    setOpen(false)
                  }}
                  className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-ink transition hover:brightness-110"
                >
                  OK
                </button>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
