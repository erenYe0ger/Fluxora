import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { PlusIcon } from './icons'
import { RAINBOW, hexToHsv, hsvToHex } from '../lib/color'

export type ColorPreset = {
  name: string
  value: string
}

type Props = {
  label: string
  presets: ColorPreset[]
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
 *
 * The popover is rendered via a React portal on document.body so it is never clipped by any
 * ancestor's overflow context (the right-bar uses overflow-y:auto which forces overflow-x:auto
 * per spec, clipping absolute children that extend outside).
 */
export function ColorPicker({ label, presets, value, customColor, onChange, onCustomColor }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const squareRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [hsv, setHsv] = useState(() => hexToHsv(customColor ?? value))
  // Position of the portal popover (top-left in viewport coords)
  const [popPos, setPopPos] = useState({ top: 0, left: 0 })

  const draft = hsvToHex(hsv.h, hsv.s, hsv.v)

  // Recalculate position whenever popover opens or window resizes/scrolls.
  // useLayoutEffect so the portal is placed before the first paint (no corner flash).
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (!rect) return
      const POPUP_W = 208 // w-52
      // Align right edge of popup with right edge of button; clamp to viewport left
      const left = Math.max(8, rect.right - POPUP_W)
      const top = rect.bottom + 8
      setPopPos({ top, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
      }
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      // The popover is portaled to document.body, so it is not inside wrapperRef.
      // Without this check every click inside it (the hue slider especially) closed
      // the panel on mousedown, which made the picker look dead.
      if (wrapperRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setOpen(false)
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

  const popover = open
    ? createPortal(
        <div
          ref={popoverRef}
          role="group"
          data-color-picker-portal
          aria-label={`${label} colour`}
          style={{ position: 'fixed', top: popPos.top, left: popPos.left, zIndex: 9999 }}
          className="animate-pop w-52 rounded-xl border border-line bg-surface p-2.5 shadow-lift"
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
                  onChange(draft)
                  setOpen(false)
                }}
                className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-ink transition hover:brightness-110"
              >
                OK
              </button>
            </span>
          </div>
        </div>,
        document.body
      )
    : null

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
          ref={buttonRef}
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

        {popover}
      </div>
    </div>
  )
}
