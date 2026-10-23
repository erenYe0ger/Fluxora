import { describe, expect, it } from 'vitest'
import { countMatches, excerptAround, findMatches } from './findMatches'

describe('findMatches', () => {
  it('is case-insensitive', () => {
    expect(findMatches('Fluxora FLUXORA fluxora', 'fluxora')).toHaveLength(3)
  })

  it('does not return overlapping matches', () => {
    expect(findMatches('aaaa', 'aa')).toEqual([
      { start: 0, end: 2 },
      { start: 2, end: 4 }
    ])
  })

  it('ignores an empty or whitespace query', () => {
    expect(findMatches('some text', '   ')).toEqual([])
  })

  it('reports positions', () => {
    expect(findMatches('one two one', 'one')).toEqual([
      { start: 0, end: 3 },
      { start: 8, end: 11 }
    ])
  })

  it('handles queries that never occur', () => {
    expect(countMatches('hello', 'world')).toBe(0)
  })
})

describe('excerptAround', () => {
  it('adds ellipses when clipped', () => {
    const text = `${'a'.repeat(60)}needle${'b'.repeat(60)}`
    const excerpt = excerptAround(text, { start: 60, end: 66 }, 10)
    expect(excerpt.startsWith('…')).toBe(true)
    expect(excerpt.endsWith('…')).toBe(true)
    expect(excerpt).toContain('needle')
  })
})
