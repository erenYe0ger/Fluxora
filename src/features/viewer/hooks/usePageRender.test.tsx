import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PDFPageProxy } from 'pdfjs-dist'
import { usePageRender } from './usePageRender'

function fakePage(renderSpy: ReturnType<typeof vi.fn>) {
  return {
    getViewport: ({ scale }: { scale: number }) => ({ width: 600 * scale, height: 800 * scale }),
    render: renderSpy
  } as unknown as PDFPageProxy
}

function Harness({ page, enabled }: { page: PDFPageProxy; enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  usePageRender({ page, scale: 1, canvasRef, enabled })
  return <canvas ref={canvasRef} />
}

describe('usePageRender', () => {
  beforeEach(() => {
    // jsdom has no 2d context; the hook bails out without one.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders once the page becomes visible', () => {
    // Regression: the canvas mounts only when the page nears the viewport, so the
    // effect has to re-run when `enabled` flips — otherwise pages stay blank.
    const renderSpy = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }))
    const page = fakePage(renderSpy)

    const { rerender } = render(<Harness page={page} enabled={false} />)
    expect(renderSpy).not.toHaveBeenCalled()

    rerender(<Harness page={page} enabled />)
    expect(renderSpy).toHaveBeenCalledTimes(1)
  })

  it('does not render while off-screen', () => {
    const renderSpy = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }))
    render(<Harness page={fakePage(renderSpy)} enabled={false} />)
    expect(renderSpy).not.toHaveBeenCalled()
  })
})
