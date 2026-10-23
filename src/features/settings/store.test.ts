import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_HIGHLIGHT_COLOR,
  DEFAULT_NOTE_COLOR,
  HIGHLIGHT_PRESETS,
  NOTE_PRESETS,
  isPresetColor,
  useSettingsStore
} from './store'

describe('settings store', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset()
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

  it('remembers custom colours, most recent first', () => {
    const store = useSettingsStore.getState()
    store.setHighlightColor('#123456')
    store.setHighlightColor('#abcdef')

    expect(useSettingsStore.getState().highlightColor).toBe('#abcdef')
    expect(useSettingsStore.getState().recentColors).toEqual(['#abcdef', '#123456'])
  })

  it('does not duplicate a colour that is already recent', () => {
    const store = useSettingsStore.getState()
    store.setHighlightColor('#123456')
    store.setHighlightColor('#abcdef')
    store.setHighlightColor('#123456')

    expect(useSettingsStore.getState().recentColors).toEqual(['#123456', '#abcdef'])
  })

  it('keeps presets out of the recent list', () => {
    useSettingsStore.getState().setHighlightColor(HIGHLIGHT_PRESETS[1].value)
    expect(useSettingsStore.getState().recentColors).toEqual([])
    expect(isPresetColor(HIGHLIGHT_PRESETS[1].value)).toBe(true)
  })

  it('resets to defaults', () => {
    useSettingsStore.getState().setTheme('light')
    useSettingsStore.getState().setHighlightColor('#123456')
    useSettingsStore.getState().reset()

    expect(useSettingsStore.getState().theme).toBe('dark')
    expect(useSettingsStore.getState().highlightColor).toBe(DEFAULT_HIGHLIGHT_COLOR)
    expect(useSettingsStore.getState().recentColors).toEqual([])
  })

  it('keeps note colour independent from highlight colour', () => {
    useSettingsStore.getState().setHighlightColor('#123456')
    useSettingsStore.getState().setNoteColor('#654321')

    expect(useSettingsStore.getState().highlightColor).toBe('#123456')
    expect(useSettingsStore.getState().noteColor).toBe('#654321')
  })

  it('starts notes from the note palette, not the highlight one', () => {
    useSettingsStore.getState().reset()
    expect(useSettingsStore.getState().noteColor).toBe(DEFAULT_NOTE_COLOR)
    expect(DEFAULT_NOTE_COLOR).not.toBe(DEFAULT_HIGHLIGHT_COLOR)
    expect(NOTE_PRESETS).not.toEqual(HIGHLIGHT_PRESETS)
  })
})
