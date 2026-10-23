import type { ReactNode } from 'react'
import { useViewerStore } from '../store/viewerStore'
import type { Tool } from '../store/viewerStore'
import {
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  DRAW_PRESETS,
  useSettingsStore
} from '@features/settings'
import { CursorIcon, HighlighterIcon, NoteIcon, PencilIcon, TextIcon, CloseIcon } from '@shared/ui/icons'

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
  { id: 'highlight', label: 'Highlight', hint: 'Select text to highlight (H)', icon: <HighlighterIcon /> },
  { id: 'note', label: 'Note', hint: 'Click the page to add a note (N)', icon: <NoteIcon /> },
  { id: 'draw', label: 'Draw', hint: 'Draw on the page (D)', icon: <PencilIcon /> },
  { id: 'text', label: 'Text', hint: 'Add text to the page (T)', icon: <TextIcon /> }
]

/** Tiny color swatches stacked vertically, fits the 56px sidebar */
function ColorSwatches({ presets, value, onChange }: { presets: { name: string; value: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      {presets.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          title={p.name}
          className={`h-5 w-5 rounded-full border border-black/15 transition hover:scale-110 ${
            p.value.toLowerCase() === value.toLowerCase() ? 'ring-1 ring-accent ring-offset-1 ring-offset-surface' : ''
          }`}
          style={{ backgroundColor: p.value }}
          aria-label={p.name}
          aria-pressed={p.value.toLowerCase() === value.toLowerCase()}
        />
      ))}
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
  const setHighlightColor = useSettingsStore((s) => s.setHighlightColor)
  const setNoteColor = useSettingsStore((s) => s.setNoteColor)

  return (
    <aside className="flex w-14 shrink-0 flex-col border-l border-line bg-surface">
      {/* Tool buttons — always at top */}
      <div className="flex flex-col items-center gap-0.5 p-1.5">
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTool(item.id)}
            aria-pressed={tool === item.id}
            title={item.hint}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              tool === item.id ? 'bg-accent text-accent-ink shadow-soft' : 'text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Tool-specific controls — pure vertical, no horizontal layouts */}
      {tool === 'highlight' && (
        <div className="flex flex-col items-center gap-2 p-1.5">
          <ColorSwatches presets={HIGHLIGHT_PRESETS} value={highlightColor} onChange={setHighlightColor} />
          <button type="button" onClick={() => setTool('select')} title="Close" className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-elevated hover:text-ink">
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {tool === 'note' && (
        <div className="flex flex-col items-center gap-2 p-1.5">
          <ColorSwatches presets={NOTE_PRESETS} value={noteColor} onChange={setNoteColor} />
          <button type="button" onClick={() => setTool('select')} title="Close" className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-elevated hover:text-ink">
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {tool === 'draw' && (
        <div className="flex flex-col items-center gap-2 p-1.5">
          <ColorSwatches presets={DRAW_PRESETS} value={drawColor} onChange={onDrawColorChange} />
          <input
            type="range" min={1} max={20} value={drawThickness}
            onChange={(e) => onDrawThicknessChange(Number(e.target.value))}
            className="h-10 w-3 cursor-pointer"
            aria-label="Thickness"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
          <span className="text-[9px] font-medium text-ink">{drawThickness}</span>
          <button type="button" onClick={() => setTool('select')} title="Close" className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-elevated hover:text-ink">
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {tool === 'text' && (
        <div className="flex flex-col items-center gap-2 p-1.5">
          <ColorSwatches presets={DRAW_PRESETS} value={textColor} onChange={onTextColorChange} />
          <button
            type="button" onClick={() => {
              const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana']
              const idx = fonts.findIndex((f) => textFontFamily.startsWith(f))
              onTextFontFamilyChange(fonts[(idx + 1) % fonts.length])
            }}
            title={textFontFamily}
            className="flex h-6 w-8 items-center justify-center rounded bg-surface-2 text-[9px] text-muted transition hover:bg-elevated hover:text-ink"
          >
            Aa
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <button type="button" onClick={() => onTextFontSizeChange(Math.min(72, textFontSize + 2))} className="flex h-4 w-6 items-center justify-center rounded bg-surface-2 text-[9px] text-muted transition hover:bg-elevated hover:text-ink" aria-label="Increase size">+</button>
            <span className="text-[9px] font-medium text-ink">{textFontSize}</span>
            <button type="button" onClick={() => onTextFontSizeChange(Math.max(8, textFontSize - 2))} className="flex h-4 w-6 items-center justify-center rounded bg-surface-2 text-[9px] text-muted transition hover:bg-elevated hover:text-ink" aria-label="Decrease size">−</button>
          </div>
          <button type="button" onClick={() => onTextBoldChange(!textBold)} aria-pressed={textBold} aria-label="Bold" title="Bold"
            className={`flex h-6 w-8 items-center justify-center rounded text-[10px] font-bold transition ${textBold ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'}`}>
            B
          </button>
          <button type="button" onClick={() => onTextItalicChange(!textItalic)} aria-pressed={textItalic} aria-label="Italic" title="Italic"
            className={`flex h-6 w-8 items-center justify-center rounded text-[10px] italic transition ${textItalic ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'}`}>
            I
          </button>
          <button type="button" onClick={() => onTextUnderlineChange(!textUnderline)} aria-pressed={textUnderline} aria-label="Underline" title="Underline"
            className={`flex h-6 w-8 items-center justify-center rounded text-[10px] transition ${textUnderline ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-muted hover:bg-elevated hover:text-ink'}`}>
            U
          </button>
          <button type="button" onClick={() => setTool('select')} title="Close" className="flex h-6 w-6 items-center justify-center rounded text-muted transition hover:bg-elevated hover:text-ink">
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </aside>
  )
}
