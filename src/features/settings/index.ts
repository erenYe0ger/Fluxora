// Public surface of the settings feature. Cross-cutting by nature: any screen may
// render the settings menu or read the current preferences.
export {
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  DRAW_PRESETS,
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_NOTE_COLOR,
  useSettingsStore
} from './store'
export type { Theme, HighlightPreset } from './store'
export { applyTheme, useThemeSync } from './theme'
export { SettingsMenu } from './components/SettingsMenu'
