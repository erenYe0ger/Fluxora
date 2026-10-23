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

export const DEFAULT_HIGHLIGHT_COLOR = HIGHLIGHT_PRESETS[0].value

const MAX_RECENT_COLORS = 5

export function isPresetColor(value: string): boolean {
  return HIGHLIGHT_PRESETS.some((preset) => preset.value.toLowerCase() === value.toLowerCase())
}

type SettingsState = {
  theme: Theme
  highlightColor: string
  /** Custom colours the user picked, most recent first. */
  recentColors: string[]
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setHighlightColor: (value: string) => void
  reset: () => void
}

const defaults = {
  theme: 'dark' as Theme,
  highlightColor: DEFAULT_HIGHLIGHT_COLOR,
  recentColors: [] as string[]
}

/**
 * User preferences, persisted to localStorage. Kept deliberately small: anything
 * document-specific belongs in IndexedDB, not here.
 */
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setHighlightColor: (value) =>
        set((state) => {
          // Only remember genuinely custom colours, and keep the list short.
          const nextRecent = isPresetColor(value)
            ? state.recentColors
            : [value, ...state.recentColors.filter((color) => color !== value)].slice(
                0,
                MAX_RECENT_COLORS
              )
          return { highlightColor: value, recentColors: nextRecent }
        }),
      reset: () => set({ ...defaults })
    }),
    {
      name: 'fluxora:settings',
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        highlightColor: state.highlightColor,
        recentColors: state.recentColors
      })
    }
  )
)
