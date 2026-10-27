import type { ReactNode } from 'react'
import { useViewerStore } from '../store/viewerStore'
import type { Tool } from '../store/viewerStore'
import {
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  DRAW_PRESETS,
  useSettingsStore
} from '@features/settings'
import { ColorPicker } from './ColorPicker'
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
  onTextColorChange?: (color: string) => void
  onTextFontSizeChange?: (fontSize: number) => void
  onTextBoldChange?: (bold: boolean) => void
  onTextItalicChange?: (italic: boolean) => void
  onTextUnderlineChange?: (underline: boolean) => void
  textColor?: string
  textFontSize?: number
  textBold?: boolean
  textItalic?: boolean
  textUnderline?: boolean
}

const TOOLS: { id: Tool; label: string; hint: string; icon: ReactNode }[] = [
  { id: 'select', label: 'Select', hint: 'Select text (V)', icon: <CursorIcon /> },
  { id: 'highlight', label: 'Highlight', hint: 'Highlight (H)', icon: <HighlighterIcon /> },
  { id: 'note', label: 'Note', hint: 'Add note (N)', icon: <NoteIcon /> },
  { id: 'draw', label: 'Draw', hint: 'Draw (D)', icon: <PencilIcon /> },
  { id: 'text', label: 'Text', hint: 'Add text (T)', icon: <TextIcon /> }
]

export function AnnotationToolbar({
  onDrawColorChange,
  onDrawThicknessChange,
  drawColor,
  drawThickness
}: Props) {
  const tool = useViewerStore((s) => s.tool)
  const setTool = useViewerStore((s) => s.setTool)

  const highlightColor = useSettingsStore((s) => s.highlightColor)
  const noteColor = useSettingsStore((s) => s.noteColor)
  const customHighlightColor = useSettingsStore((s) => s.customHighlightColor)
  const customNoteColor = useSettingsStore((s) => s.customNoteColor)
  const customDrawColor = useSettingsStore((s) => s.customDrawColor)
  const setHighlightColor = useSettingsStore((s) => s.setHighlightColor)
  const setNoteColor = useSettingsStore((s) => s.setNoteColor)
  const setCustomHighlightColor = useSettingsStore((s) => s.setCustomHighlightColor)
  const setCustomNoteColor = useSettingsStore((s) => s.setCustomNoteColor)
  const setCustomDrawColor = useSettingsStore((s) => s.setCustomDrawColor)

  // Text tool controls live inside the on-page text dialog, so the rightbar remains the tools rail
  const isToolActive = tool !== 'select' && tool !== 'text'

  return (
    <aside className="flex w-40 shrink-0 flex-col border-l border-line bg-surface">
      {/* ── Vertical tools rail (visible in select mode and text mode) ── */}
      {!isToolActive && (
        <div className="flex flex-col gap-0.5 p-1.5">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTool(item.id)}
              aria-pressed={tool === item.id}
              title={item.hint}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
                tool === item.id
                  ? 'bg-accent text-accent-ink shadow-soft font-semibold'
                  : 'text-muted hover:bg-elevated hover:text-ink'
              }`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Settings panel (shown only when highlight, note, or draw is active) ── */}
      {isToolActive && (
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
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
            </span>
          </div>

          {/* Scrollable settings content */}
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2.5">
            <div className="flex flex-col gap-3">

              {/* ── Highlight settings ──────────────────────── */}
              {tool === 'highlight' && (
                <div className="flex flex-col gap-2">
                  <ColorPicker
                    label="Highlight"
                    presets={HIGHLIGHT_PRESETS}
                    value={highlightColor}
                    customColor={customHighlightColor}
                    onChange={setHighlightColor}
                    onCustomColor={setCustomHighlightColor}
                  />
                </div>
              )}

              {/* ── Note settings ────────────────────────────── */}
              {tool === 'note' && (
                <div className="flex flex-col gap-2">
                  <ColorPicker
                    label="Note"
                    presets={NOTE_PRESETS}
                    value={noteColor}
                    customColor={customNoteColor}
                    onChange={setNoteColor}
                    onCustomColor={setCustomNoteColor}
                  />
                </div>
              )}

              {/* ── Draw settings ────────────────────────────── */}
              {tool === 'draw' && (
                <div className="flex flex-col gap-2.5">
                  <ColorPicker
                    label="Draw"
                    presets={DRAW_PRESETS}
                    value={drawColor}
                    customColor={customDrawColor}
                    onChange={onDrawColorChange}
                    onCustomColor={setCustomDrawColor}
                  />
                  {/* Thickness */}
                  <div className="flex flex-col gap-1">
                    <p className="text-[9px] font-medium uppercase tracking-wide text-muted">Thickness</p>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min={1}
                        max={20}
                        value={drawThickness}
                        onChange={(e) => onDrawThicknessChange(Number(e.target.value))}
                        className="h-1.5 flex-1 cursor-pointer rounded-full"
                        aria-label="Thickness"
                      />
                      <span className="min-w-[1.75rem] text-right text-xs font-medium tabular-nums text-ink">
                        {drawThickness}
                      </span>
                    </div>
                    {/* Preview stroke */}
                    <div className="rounded-lg border border-line bg-surface-2 p-1.5">
                      <svg viewBox="0 0 120 16" className="w-full" aria-hidden>
                        <path
                          d="M4 8 Q30 2 60 8 T116 8"
                          fill="none"
                          stroke={drawColor}
                          strokeWidth={Math.min(drawThickness * 1.2, 8)}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
