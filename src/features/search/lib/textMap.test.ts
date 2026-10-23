import { describe, expect, it } from 'vitest'
import { buildTextMap, locateMatch } from './textMap'
import { findMatches } from './findMatches'

function containerWith(parts: string[]): HTMLElement {
  const root = document.createElement('div')
  for (const part of parts) {
    const span = document.createElement('span')
    span.textContent = part
    root.append(span)
  }
  return root
}

describe('buildTextMap', () => {
  it('concatenates spans and records offsets', () => {
    const root = containerWith(['Hello ', 'world'])
    const map = buildTextMap(root)
    expect(map.text).toBe('Hello world')
    expect(map.spans).toHaveLength(2)
    expect(map.spans[1]).toMatchObject({ start: 6, end: 11 })
  })

  it('skips empty text nodes', () => {
    const root = containerWith(['a', '', 'b'])
    const map = buildTextMap(root)
    expect(map.text).toBe('ab')
    expect(map.spans).toHaveLength(2)
  })
})

describe('locateMatch', () => {
  it('locates a match inside one span', () => {
    const root = containerWith(['Hello world'])
    const map = buildTextMap(root)
    const [match] = findMatches(map.text, 'world')
    const range = locateMatch(map.spans, match)
    expect(range).not.toBeNull()
    expect(range?.startOffset).toBe(6)
    expect(range?.endOffset).toBe(11)
  })

  it('locates a match spanning two spans', () => {
    const root = containerWith(['Hel', 'lo world'])
    const map = buildTextMap(root)
    const [match] = findMatches(map.text, 'Hello')
    const range = locateMatch(map.spans, match)
    expect(range?.startNode.textContent).toBe('Hel')
    expect(range?.endNode.textContent).toBe('lo world')
    expect(range?.endOffset).toBe(2)
  })

  it('returns null when the match is out of bounds', () => {
    const root = containerWith(['abc'])
    const map = buildTextMap(root)
    expect(locateMatch(map.spans, { start: 10, end: 20 })).toBeNull()
  })
})
