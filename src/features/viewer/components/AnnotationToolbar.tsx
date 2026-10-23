import { useRef } from 'react'
import type { ReactNode } from 'react'
import { useViewerStore } from '../store/viewerStore'
import type { Tool } from '../store/viewerStore'
import {
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  DRAW_PRESETS,
  useSettingsStore
} from '@features/settings'
import {
  CursorIcon,
  HighlighterIcon,
  NoteIcon,
  PencilIcon,
  TextIcon,
  ArrowLeftIcon
} from '@shared/ui/icons'

type Props = {
  onDrawColorChange: (color: string) => void
  onDrawThicknessChange: (thickness: number) => void
  drawColor: string
  drawThickness: number
  onTextColorChange: (color: string) => void
  onTextFontFamilyChange: (fontFamily: string) => void
  onTextFontSizeChange: (fontSize: number) => void
  onTextBoldChange: (bold: boolean) => void
  onTextItalicChange: (italic: boolean) => void
  onTextUnderlineChange: (underline: boolean) => void
  textColor: string
  textFontFamily: string
  textFontSize: number
  textBold: boolean
  textItalic: boolean
  textUnderline: boolean
}

const TOOLS: { id: Tool; label: string; hint: string; icon: ReactNode }[] = [
  { id: 'select', label: 'Select', hint: 'Select text (V)', icon: <CursorIcon /> },
  { id: 'highlight', label: 'Highlight', hint: 'Highlight (H)', icon: <HighlighterIcon /> },
  { id: 'note', label: 'Note', hint: 'Add note (N)', icon: <NoteIcon /> },
  { id: 'draw', label: 'Draw', hint: 'Draw (D)', icon: <PencilIcon /> },
  { id: 'text', label: 'Text', hint: 'Add text (T)', icon: <TextIcon /> }
]

/** Small preset color circles in a row. */
function PresetRow({
  presets,
  value,
  onChange
}: {
  presets: { name: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {presets.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          title={p.name}
          aria-label={p.name}
          aria-pressed={p.value.toLowerCase() === value.toLowerCase()}
          className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
            p.value.toLowerCase() === value.toLowerCase()
              ? 'border-accent scale-110 shadow-[0_0_0_3px_var(--accent-soft)]'
              : 'border-line hover:border-line-strong'
          }`}
          style={{ backgroundColor: p.value }}
        />
      ))}
    </div>
  )
}

/** Custom color picker: styled native input with a color swatch preview. */
function CustomColorPicker({
  color,
  onChange
}: {
  color: string
  onChange: (v: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-col items-center gap-1">
      {/* Visible swatch that opens the native picker */}
      <button
        type="button"
        title="Custom color"
        aria-label="Pick custom color"
        onClick={() => inputRef.current?.click()}
        className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-dashed border-line-strong transition-all hover:scale-110 hover:border-accent"
        style={{ backgroundColor: color }}
      >
        {/* Gradient hint for "custom" */}
        <span className="absolute inset-0 bg-[conic-gradient(#fff_0deg,#fff_90deg,transparent_90deg,transparent_270deg,#fff_270deg,#fff_360deg)] opacity-30" />
      </button>
      {/* Hidden native color input */}
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        aria-label="Custom color picker"
      />
      <span className="text-[9px] text-muted">Custom</span>
    </div>
  )
}

export function AnnotationToolbar({
  onDrawColorChange,
  onDrawThicknessChange,
  drawColor,
  drawThickness,
  onTextColorChange,
  onTextFontFamilyChange,
  onTextFontSizeChange,
  onTextBoldChange,
  onTextItalicChange,
  onTextUnderlineChange,
  textColor,
  textFontFamily,
  textFontSize,
  textBold,
  textItalic,
  textUnderline
}: Props) {
  const tool = useViewerStore((s) => s.tool)
  const setTool = useViewerStore((s) => s.setTool)
  const highlightColor = useSettingsStore((s) => s.highlightColor)
  const noteColor = useSettingsStore((s) => s.noteColor)
  const customHighlightColor = useSettingsStore((s) => s.customHighlightColor)
  const customNoteColor = useSettingsStore((s) => s.customNoteColor)
  const customDrawColor = useSettingsStore((s) => s.customDrawColor)
  const customTextColor = useSettingsStore((s) => s.customTextColor)
  const setHighlightColor = useSettingsStore((s) => s.setHighlightColor)
  const setNoteColor = useSettingsStore((s) => s.setNoteColor)
  const setCustomHighlightColor = useSettingsStore((s) => s.setCustomHighlightColor)
  const setCustomNoteColor = useSettingsStore((s) => s.setCustomNoteColor)
  const setCustomDrawColor = useSettingsStore((s) => s.setCustomDrawColor)
  const setCustomTextColor = useSettingsStore((s) => s.setCustomTextColor)

  const isToolActive = tool !== 'select'

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-line bg-surface">
      {/* ── Vertical tools rail (visible only when no tool is active) ── */}
      {!isToolActive && (
        <div className="flex flex-col gap-0.5 p-2">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTool(item.id)}
              aria-pressed={tool === item.id}
              title={item.hint}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-muted transition-all hover:bg-elevated hover:text-ink"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Settings panel (shown only when a tool is active) ── */}
      {isToolActive && (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <button
              type="button"
              onClick={() => setTool('select')}
              title="Back to tools"
              aria-label="Back to tools"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-elevated hover:text-ink"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
              {tool === 'highlight' && 'Highlight'}
              {tool === 'note' && 'Note'}
              {tool === 'draw' && 'Draw'}
              {tool === 'text' && 'Text'}
            </span>
          </div>

          {/* Scrollable settings content */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
            <div className="flex flex-col gap-4">
              {/* ── Highlight settings ──────────────────────── */}
              {tool === 'highlight' && (
                <>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Color</p>
                    <div className="flex items-center gap-2">
                      <PresetRow
                        presets={HIGHLIGHT_PRESETS}
                        value={highlightColor}
                        onChange={setHighlightColor}
                      />
                      <CustomColorPicker
                        color={customHighlightColor ?? '#ffffff'}
                        onChange={setCustomHighlightColor}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Note settings ────────────────────────────── */}
              {tool === 'note' && (
                <>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Color</p>
                    <div className="flex items-center gap-2">
                      <PresetRow
                        presets={NOTE_PRESETS}
                        value={noteColor}
                        onChange={setNoteColor}
                      />
                      <CustomColorPicker
                        color={customNoteColor ?? '#ffffff'}
                        onChange={setCustomNoteColor}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── Draw settings ────────────────────────────── */}
              {tool === 'draw' && (
                <>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Color</p>
                    <div className="flex items-center gap-2">
                      <PresetRow
                        presets={DRAW_PRESETS}
                        value={drawColor}
                        onChange={onDrawColorChange}
                      />
                      <CustomColorPicker
                        color={customDrawColor ?? '#000000'}
                        onChange={setCustomDrawColor}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">
                      Thickness
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={drawThickness}
                        onChange={(e) => onDrawThicknessChange(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer rounded-full"
                        aria-label="Stroke thickness"
                      />
                      <span className="min-w-[2rem] text-right text-xs font-medium tabular-nums text-ink">
                        {drawThickness}px
                      </span>
                    </div>
                    {/* Preview stroke */}
                    <div className="mt-2 rounded-lg border border-line bg-surface-2 p-2">
                      <svg viewBox="0 0 120 20" className="w-full" aria-hidden>
                        <path
                          d="M4 10 Q30 2 60 10 T116 10"
                          fill="none"
                          stroke={drawColor}
                          strokeWidth={Math.min(drawThickness * 1.2, 10)}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </>
              )}

              {/* ── Text settings ───────────────────────────── */}
              {tool === 'text' && (
                <>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Color</p>
                    <div className="flex items-center gap-2">
                      <PresetRow
                        presets={DRAW_PRESETS}
                        value={textColor}
                        onChange={onTextColorChange}
                      />
                      <CustomColorPicker
                        color={customTextColor ?? '#000000'}
                        onChange={setCustomTextColor}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Font</p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {['Arial', 'Georgia', 'Times New Roman'].map((font) => (
                        <button
                          key={font}
                          type="button"
                          onClick={() => onTextFontFamilyChange(font)}
                          title={font}
                          className={`rounded-lg border px-1.5 py-2 text-center text-[10px] leading-tight transition-all hover:border-line-strong ${
                            textFontFamily.startsWith(font)
                              ? 'border-accent bg-accent-soft text-accent'
                              : 'border-line text-muted'
                          }`}
                          style={{ fontFamily: font }}
                        >
                          Aa
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Size</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onTextFontSizeChange(Math.max(8, textFontSize - 2))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
                        aria-label="Decrease font size"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center text-xs font-medium tabular-nums text-ink">
                        {textFontSize}px
                      </span>
                      <button
                        type="button"
                        onClick={() => onTextFontSizeChange(Math.min(72, textFontSize + 2))}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-2 text-sm font-medium text-muted transition hover:border-line-strong hover:text-ink"
                        aria-label="Increase font size"
                      >
                        +
                      </button>
                    </div>
                    {/* Live preview */}
                    <div
                      className="mt-2 rounded-lg border border-line bg-surface-2 p-2 text-center"
                      style={{
                        fontFamily: textFontFamily,
                        fontSize: Math.min(textFontSize, 24),
                        fontWeight: textBold ? 'bold' : 'normal',
                        fontStyle: textItalic ? 'italic' : 'normal',
                        textDecoration: textUnderline ? 'underline' : 'none',
                        color: textColor
                      }}
                    >
                      Aa
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-muted">Style</p>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => onTextBoldChange(!textBold)}
                        aria-pressed={textBold}
                        aria-label="Bold"
                        title="Bold"
                        className={`flex h-8 w-9 items-center justify-center rounded-lg border text-sm font-bold transition-all ${
                          textBold
                            ? 'border-accent bg-accent text-accent-ink'
                            : 'border-line text-muted hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => onTextItalicChange(!textItalic)}
                        aria-pressed={textItalic}
                        aria-label="Italic"
                        title="Italic"
                        className={`flex h-8 w-9 items-center justify-center rounded-lg border text-sm italic transition-all ${
                          textItalic
                            ? 'border-accent bg-accent text-accent-ink'
                            : 'border-line text-muted hover:border-line-strong hover:text-ink'
                        }`}
                      >
                        I
                      </button>
                      <button
                        type="button"
                        onClick={() => onTextUnderlineChange(!textUnderline)}
                        aria-pressed={textUnderline}
                        aria-label="Underline"
                        title="Underline"
                        className={`flex h-8 w-9 items-center justify-center rounded-lg border text-sm transition-all ${
                          textUnderline
                            ? 'border-accent bg-accent text-accent-ink'
                            : 'border-line text-muted hover:border-line-strong hover:text-ink'
                        } ${textUnderline ? '' : 'underline'}`}
                      >
                        U
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}