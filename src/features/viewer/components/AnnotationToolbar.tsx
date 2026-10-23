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
import { CursorIcon, HighlighterIcon, NoteIcon, PencilIcon, TextIcon } from '@shared/ui/icons'

type Props = {
  onDrawColorChange: (color: string) => void
  onDrawThicknessChange: (thickness: number) => void
  drawColor: string
  drawThickness: number
  customDrawColor: string | null
  onCustomDrawColor: (color: string) => void
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
  customTextColor: string | null
  onCustomTextColor: (color: string) => void
}

const TOOLS: { id: Tool; label: string; hint: string; icon: ReactNode }[] = [
  { id: 'select', label: 'Select', hint: 'Select text (V)', icon: <CursorIcon /> },
  {
    id: 'highlight',
    label: 'Highlight',
    hint: 'Select text to highlight (H)',
    icon: <HighlighterIcon />
  },
  { id: 'note', label: 'Note', hint: 'Click the page to add a note (N)', icon: <NoteIcon /> },
  { id: 'draw', label: 'Draw', hint: 'Draw on the page (D)', icon: <PencilIcon /> },
  { id: 'text', label: 'Text', hint: 'Add text to the page (T)', icon: <TextIcon /> }
]

export function AnnotationToolbar({
  onDrawColorChange,
  onDrawThicknessChange,
  drawColor,
  drawThickness,
  customDrawColor,
  onCustomDrawColor,
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
  textUnderline,
  customTextColor,
  onCustomTextColor
}: Props) {
  const tool = useViewerStore((state) => state.tool)
  const setTool = useViewerStore((state) => state.setTool)

  const highlightColor = useSettingsStore((state) => state.highlightColor)
  const noteColor = useSettingsStore((state) => state.noteColor)
  const customHighlightColor = useSettingsStore((state) => state.customHighlightColor)
  const customNoteColor = useSettingsStore((state) => state.customNoteColor)
  const setHighlightColor = useSettingsStore((state) => state.setHighlightColor)
  const setNoteColor = useSettingsStore((state) => state.setNoteColor)
  const setCustomHighlightColor = useSettingsStore((state) => state.setCustomHighlightColor)
  const setCustomNoteColor = useSettingsStore((state) => state.setCustomNoteColor)

  return (
    <aside className="animate-slide-in flex w-14 shrink-0 flex-col items-center gap-1 border-l border-line bg-surface py-3">
      {/* Tool buttons */}
      <div
        role="toolbar"
        aria-label="Annotation tools"
        className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface-2 p-1"
      >
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTool(item.id)}
            aria-pressed={tool === item.id}
            title={item.hint}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition duration-150 ${
              tool === item.id
                ? 'bg-accent text-accent-ink shadow-soft'
                : 'text-muted hover:bg-elevated hover:text-ink'
            }`}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Tool-specific options */}
      <div className="mt-2 flex flex-col items-center gap-2">
        {tool === 'highlight' && (
          <ColorPicker
            label="Highlight colour"
            presets={HIGHLIGHT_PRESETS}
            value={highlightColor}
            customColor={customHighlightColor}
            onChange={setHighlightColor}
            onCustomColor={setCustomHighlightColor}
          />
        )}
        {tool === 'note' && (
          <ColorPicker
            label="Note colour"
            presets={NOTE_PRESETS}
            value={noteColor}
            customColor={customNoteColor}
            onChange={setNoteColor}
            onCustomColor={setCustomNoteColor}
          />
        )}
        {tool === 'draw' && (
          <div className="flex flex-col items-center gap-2">
            <ColorPicker
              label="Draw colour"
              presets={DRAW_PRESETS}
              value={drawColor}
              customColor={customDrawColor}
              onChange={onDrawColorChange}
              onCustomColor={onCustomDrawColor}
            />
            {/* Thickness slider */}
            <div className="flex flex-col items-center gap-1 px-1">
              <span className="text-[10px] text-muted">Thickness</span>
              <input
                type="range"
                min={1}
                max={20}
                value={drawThickness}
                onChange={(e) => onDrawThicknessChange(Number(e.target.value))}
                className="h-20 w-4"
                aria-label="Draw thickness"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
              <span className="text-[10px] font-medium text-ink">{drawThickness}px</span>
            </div>
          </div>
        )}
        {tool === 'text' && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface-2 p-2">
            {/* Color picker */}
            <ColorPicker
              label="Text colour"
              presets={DRAW_PRESETS}
              value={textColor}
              customColor={customTextColor}
              onChange={onTextColorChange}
              onCustomColor={onCustomTextColor}
            />
            {/* Font family */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted">Font</span>
              <select
                value={textFontFamily}
                onChange={(e) => onTextFontFamilyChange(e.target.value)}
                className="rounded-md border border-line bg-surface-2 p-1 text-[10px] text-ink outline-none focus:border-accent/60"
                aria-label="Font family"
              >
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times</option>
                <option value="Courier New">Courier</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
            {/* Font size */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted">Size</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onTextFontSizeChange(Math.max(8, textFontSize - 2))}
                  className="flex h-5 w-5 items-center justify-center rounded bg-surface text-[10px] text-ink hover:bg-elevated"
                  aria-label="Decrease font size"
                >
                  -
                </button>
                <span className="w-6 text-center text-[10px] font-medium text-ink">{textFontSize}</span>
                <button
                  type="button"
                  onClick={() => onTextFontSizeChange(Math.min(72, textFontSize + 2))}
                  className="flex h-5 w-5 items-center justify-center rounded bg-surface text-[10px] text-ink hover:bg-elevated"
                  aria-label="Increase font size"
                >
                  +
                </button>
              </div>
            </div>
            {/* Style buttons */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-muted">Style</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onTextBoldChange(!textBold)}
                  aria-pressed={textBold}
                  aria-label="Bold"
                  className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold transition ${
                    textBold ? 'bg-accent text-accent-ink' : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => onTextItalicChange(!textItalic)}
                  aria-pressed={textItalic}
                  aria-label="Italic"
                  className={`flex h-6 w-6 items-center justify-center rounded text-[10px] italic transition ${
                    textItalic ? 'bg-accent text-accent-ink' : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => onTextUnderlineChange(!textUnderline)}
                  aria-pressed={textUnderline}
                  aria-label="Underline"
                  className={`flex h-6 w-6 items-center justify-center rounded text-[10px] transition ${
                    textUnderline ? 'bg-accent text-accent-ink' : 'bg-surface text-muted hover:bg-elevated hover:text-ink'
                  }`}
                  style={{ textDecoration: textUnderline ? 'underline' : 'none' }}
                >
                  U
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}