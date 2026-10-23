import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'dark' | 'light'

export type HighlightPreset = {
  name: string
  value: string
}

/** Named starting points; the picker lets people go beyond them. */
export const HIGHLIGHT_PRESETS: HighlightPreset[] = [
  { name: 'Sunbeam', value: '#fde047' },
  { name: 'Mint', value: '#8ce7a8' },
  { name: 'Sky', value: '#93c5fd' },
  { name: 'Blossom', value: '#f9a8d4' },
  { name: 'Tangerine', value: '#fdba74' },
  { name: 'Lilac', value: '#c4b5fd' }
]

/** Notes are markers, not ink, so they start from a warmer, darker palette. */
export const NOTE_PRESETS: HighlightPreset[] = [
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#fb7185' },
  { name: 'Teal', value: '#2dd4bf' },
  { name: 'Violet', value: '#a78bfa' },
  { name: 'Emerald', value: '#34d399' },
  { name: 'Slate', value: '#94a3b8' }
]

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_PRESETS[0].value
export const DEFAULT_NOTE_COLOR = NOTE_PRESETS[0].value

const MAX_RECENT_COLORS = 5

export function isPresetColor(value: string): boolean {
  return [...HIGHLIGHT_PRESETS, ...NOTE_PRESETS].some(
    (preset) => preset.value.toLowerCase() === value.toLowerCase()
  )
}

type SettingsState = {
  theme: Theme
  highlightColor: string
  noteColor: string
  /** Custom colours the user picked, most recent first. */
  recentColors: string[]
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setHighlightColor: (value: string) => void
  setNoteColor: (value: string) => void
  reset: () => void
}

const defaults = {
  theme: 'dark' as Theme,
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  noteColor: DEFAULT_NOTE_COLOR,
  recentColors: [] as string[]
}

/**
 * User preferences, persisted to localStorage. Kept deliberately small: anything
 * document-specific belongs in IndexedDB, not here. The reader's colour pickers write
 * here so a choice sticks across sessions, but they are surfaced in the reader, not
 * in the settings dialog.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => {
      const remember = (state: SettingsState, value: string) =>
        isPresetColor(value)
          ? state.recentColors
          : [value, ...state.recentColors.filter((color) => color !== value)].slice(
              0,
              MAX_RECENT_COLORS
            )

      return {
        ...defaults,
        setTheme: (theme) => set({ theme }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
        setHighlightColor: (value) =>
          set((state) => ({ highlightColor: value, recentColors: remember(state, value) })),
        setNoteColor: (value) =>
          set((state) => ({ noteColor: value, recentColors: remember(state, value) })),
        reset: () => set({ ...defaults })
      }
    },
    {
      name: 'fluxora:settings',
      version: 2,
      partialize: (state) => ({
        theme: state.theme,
        highlightColor: state.highlightColor,
        noteColor: state.noteColor,
        recentColors: state.recentColors
      })
    }
  )
)
