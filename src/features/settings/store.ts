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

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_PRESETS[0].value
export const DEFAULT_NOTE_COLOR = NOTE_PRESETS[0].value

type SettingsState = {
  theme: Theme
  highlightColor: string
  noteColor: string
  /** Remembered custom colours, so the fourth swatch survives a reload. */
  customHighlightColor: string | null
  customNoteColor: string | null
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setHighlightColor: (value: string) => void
  setNoteColor: (value: string) => void
  setCustomHighlightColor: (value: string) => void
  setCustomNoteColor: (value: string) => void
  reset: () => void
}

const defaults = {
  theme: 'dark' as Theme,
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  noteColor: DEFAULT_NOTE_COLOR,
  customHighlightColor: null as string | null,
  customNoteColor: null as string | null
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
      reset: () => set({ ...defaults })
    }),
    {
      name: 'fluxora:settings',
      version: 3,
      partialize: (state) => ({
        theme: state.theme,
        highlightColor: state.highlightColor,
        noteColor: state.noteColor,
        customHighlightColor: state.customHighlightColor,
        customNoteColor: state.customNoteColor
      })
    }
  )
)
