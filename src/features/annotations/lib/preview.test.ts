import { describe, expect, it } from 'vitest'
import { previewText } from './preview'

describe('previewText', () => {
  it('returns short text untouched, with no ellipsis', () => {
    expect(previewText('Hello Fluxora')).toBe('Hello Fluxora')
  })

  it('adds no ellipsis when the text ends exactly at the limit', () => {
    expect(previewText('a b c d e f g h')).toBe('a b c d e f g h')
  })

  it('cuts on a word boundary and marks the cut', () => {
    expect(previewText('a b c d e f g h i j')).toBe('a b c d e f g h…')
  })

  it('collapses newlines and repeated whitespace', () => {
    expect(previewText('  line one\n\nline two\t line three ')).toBe('line one line two line three')
  })

  it('handles empty and whitespace-only text', () => {
    expect(previewText('')).toBe('')
    expect(previewText('   \n  ')).toBe('')
  })

  it('honours a custom limit', () => {
    expect(previewText('one two three four', 2)).toBe('one two…')
    expect(previewText('one two', 2)).toBe('one two')
  })
})
