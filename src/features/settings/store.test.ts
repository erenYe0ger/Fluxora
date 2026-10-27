import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_NOTE_COLOR,
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  useSettingsStore
} from './store'

describe('settings store', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
  })

  it('defaults text font size to 18px', () => {
    expect(useSettingsStore.getState().textFontSize).toBe(18)
  })

  it('defaults to dark mode', () => {
    expect(useSettingsStore.getState().theme).toBe('dark')
  })

  it('toggles between themes', () => {
    useSettingsStore.getState().toggleTheme()
    expect(useSettingsStore.getState().theme).toBe('light')
    useSettingsStore.getState().toggleTheme()
    expect(useSettingsStore.getState().theme).toBe('dark')
  })

  it('offers three presets per tool plus a custom slot', () => {
    expect(HIGHLIGHT_PRESETS).toHaveLength(3)
    expect(NOTE_PRESETS).toHaveLength(3)
    expect(HIGHLIGHT_PRESETS.map((preset) => preset.name)).toEqual(['Yellow', 'Green', 'Blue'])
    // The custom slot starts empty; it is filled only when the user confirms a colour.
    expect(useSettingsStore.getState().customHighlightColor).toBeNull()
    expect(useSettingsStore.getState().customNoteColor).toBeNull()
  })

  it('selects a preset colour', () => {
    useSettingsStore.getState().setHighlightColor(HIGHLIGHT_PRESETS[2].value)
    expect(useSettingsStore.getState().highlightColor).toBe(HIGHLIGHT_PRESETS[2].value)
    expect(useSettingsStore.getState().customHighlightColor).toBeNull()
  })

  it('remembers and selects a custom colour', () => {
    useSettingsStore.getState().setCustomHighlightColor('#abcdef')

    expect(useSettingsStore.getState().customHighlightColor).toBe('#abcdef')
    expect(useSettingsStore.getState().highlightColor).toBe('#abcdef')

    // Switching back to a preset keeps the custom slot filled for later.
    useSettingsStore.getState().setHighlightColor(HIGHLIGHT_PRESETS[0].value)
    expect(useSettingsStore.getState().customHighlightColor).toBe('#abcdef')
    expect(useSettingsStore.getState().highlightColor).toBe(HIGHLIGHT_PRESETS[0].value)
  })

  it('keeps note colour independent from highlight colour', () => {
    useSettingsStore.getState().setCustomHighlightColor('#123456')
    useSettingsStore.getState().setCustomNoteColor('#654321')

    expect(useSettingsStore.getState().highlightColor).toBe('#123456')
    expect(useSettingsStore.getState().noteColor).toBe('#654321')
    expect(useSettingsStore.getState().customNoteColor).toBe('#654321')
  })

  it('starts notes from the note palette, not the highlight one', () => {
    expect(useSettingsStore.getState().noteColor).toBe(DEFAULT_NOTE_COLOR)
    expect(DEFAULT_NOTE_COLOR).not.toBe(DEFAULT_HIGHLIGHT_COLOR)
    expect(NOTE_PRESETS).not.toEqual(HIGHLIGHT_PRESETS)
  })

  it('resets to defaults', () => {
    useSettingsStore.getState().setTheme('light')
    useSettingsStore.getState().setCustomHighlightColor('#123456')
    useSettingsStore.getState().reset()

    expect(useSettingsStore.getState().theme).toBe('dark')
    expect(useSettingsStore.getState().highlightColor).toBe(DEFAULT_HIGHLIGHT_COLOR)
    expect(useSettingsStore.getState().customHighlightColor).toBeNull()
  })
})
