import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

export type HighlightPreset = {
  name: string
  value: string
}

/**
 * Three quick colours plus one custom slot per tool. Keeping the palette short is
 * deliberate: a row of ten swatches is slower to use than three good defaults.
 */
export const HIGHLIGHT_PRESETS: HighlightPreset[] = [
  { name: 'Yellow', value: '#fde047' },
  { name: 'Green', value: '#8ce7a8' },
  { name: 'Blue', value: '#93c5fd' }
]

/** Notes are markers, not ink, so they use a slightly deeper palette. */
export const NOTE_PRESETS: HighlightPreset[] = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#fb7185' },
  { name: 'Teal', value: '#2dd4bf' }
]

/** Draw and text use a broader palette. */
export const DRAW_PRESETS: HighlightPreset[] = [
  { name: 'Black', value: '#1f2937' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' }
]

/** Text font families */
export const TEXT_FONTS = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times', value: '"Times New Roman", serif' },
  { name: 'Courier', value: '"Courier New", monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' }
]

/** Text font sizes */
export const TEXT_FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72]

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_PRESETS[0].value
export const DEFAULT_NOTE_COLOR = NOTE_PRESETS[0].value
export const DEFAULT_DRAW_COLOR = DRAW_PRESETS[0].value
export const DEFAULT_DRAW_THICKNESS = 3
export const DEFAULT_TEXT_COLOR = DRAW_PRESETS[0].value
export const DEFAULT_TEXT_FONT_FAMILY = TEXT_FONTS[0].value
export const DEFAULT_TEXT_FONT_SIZE = 16

type SettingsState = {
  theme: Theme
  highlightColor: string
  noteColor: string
  /** Remembered custom colours, so the fourth swatch survives a reload. */
  customHighlightColor: string | null
  customNoteColor: string | null
  // Draw settings
  drawColor: string
  drawThickness: number
  customDrawColor: string | null
  // Text settings
  textColor: string
  textFontFamily: string
  textFontSize: number
  textBold: boolean
  textItalic: boolean
  textUnderline: boolean
  customTextColor: string | null
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setHighlightColor: (value: string) => void
  setNoteColor: (value: string) => void
  setCustomHighlightColor: (value: string) => void
  setCustomNoteColor: (value: string) => void
  setDrawColor: (value: string) => void
  setDrawThickness: (value: number) => void
  setCustomDrawColor: (value: string) => void
  setTextColor: (value: string) => void
  setTextFontFamily: (value: string) => void
  setTextFontSize: (value: number) => void
  setTextBold: (value: boolean) => void
  setTextItalic: (value: boolean) => void
  setTextUnderline: (value: boolean) => void
  setCustomTextColor: (value: string) => void
  reset: () => void
}

const defaults = {
  theme: 'dark' as Theme,
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  noteColor: DEFAULT_NOTE_COLOR,
  customHighlightColor: null as string | null,
  customNoteColor: null as string | null,
  // Draw defaults
  drawColor: DEFAULT_DRAW_COLOR,
  drawThickness: DEFAULT_DRAW_THICKNESS,
  customDrawColor: null as string | null,
  // Text defaults
  textColor: DEFAULT_TEXT_COLOR,
  textFontFamily: DEFAULT_TEXT_FONT_FAMILY,
  textFontSize: DEFAULT_TEXT_FONT_SIZE,
  textBold: false,
  textItalic: false,
  textUnderline: false,
  customTextColor: null as string | null
}

/**
 * User preferences, persisted to localStorage. Documents and annotations belong in
 * IndexedDB; this store only remembers how the app should look and which colours the
 * annotation tools are currently using.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setHighlightColor: (highlightColor) => set({ highlightColor }),
      setNoteColor: (noteColor) => set({ noteColor }),
      // Choosing a custom colour both fills the fourth slot and selects it.
      setCustomHighlightColor: (value) =>
        set({ customHighlightColor: value, highlightColor: value }),
      setCustomNoteColor: (value) => set({ customNoteColor: value, noteColor: value }),
      // Draw settings
      setDrawColor: (drawColor) => set({ drawColor }),
      setDrawThickness: (drawThickness) => set({ drawThickness }),
      setCustomDrawColor: (value) => set({ customDrawColor: value, drawColor: value }),
      // Text settings
      setTextColor: (textColor) => set({ textColor }),
      setTextFontFamily: (textFontFamily) => set({ textFontFamily }),
      setTextFontSize: (textFontSize) => set({ textFontSize }),
      setTextBold: (textBold) => set({ textBold }),
      setTextItalic: (textItalic) => set({ textItalic }),
      setTextUnderline: (textUnderline) => set({ textUnderline }),
      setCustomTextColor: (value) => set({ customTextColor: value, textColor: value }),
      reset: () => set({ ...defaults })
    }),
    {
      name: 'fluxora:settings',
      version: 4,
      partialize: (state) => ({
        theme: state.theme,
        highlightColor: state.highlightColor,
        noteColor: state.noteColor,
        customHighlightColor: state.customHighlightColor,
        customNoteColor: state.customNoteColor,
        // Draw settings
        drawColor: state.drawColor,
        drawThickness: state.drawThickness,
        customDrawColor: state.customDrawColor,
        // Text settings
        textColor: state.textColor,
        textFontFamily: state.textFontFamily,
        textFontSize: state.textFontSize,
        textBold: state.textBold,
        textItalic: state.textItalic,
        textUnderline: state.textUnderline,
        customTextColor: state.customTextColor
      })
    }
  )
)
