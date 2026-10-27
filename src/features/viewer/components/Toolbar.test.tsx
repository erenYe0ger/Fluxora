import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Toolbar } from './Toolbar'
import type { SearchBarState } from '@features/search'

const mockSearch: SearchBarState = {
  query: '',
  setQuery: vi.fn(),
  total: 0,
  activeIndex: 0,
  searching: false,
  next: vi.fn(),
  previous: vi.fn(),
  clear: vi.fn()
}

describe('Toolbar export menu', () => {
  it('toggles the export dropdown menu with JSON and PDF export options', () => {
    const onExportJson = vi.fn()
    const onExportPdf = vi.fn()

    render(
      <Toolbar
        fileName="sample.pdf"
        numPages={5}
        onBack={vi.fn()}
        onJumpToPage={vi.fn()}
        onExportJson={onExportJson}
        onExportPdf={onExportPdf}
        onUndo={vi.fn()}
        canUndo={false}
        search={mockSearch}
      />
    )

    const downloadBtn = screen.getByLabelText('Download options')
    expect(screen.queryByRole('menu')).toBeNull()

    // Open menu
    fireEvent.click(downloadBtn)
    expect(screen.getByRole('menu')).toBeTruthy()
    expect(screen.getByText('JSON export')).toBeTruthy()
    expect(screen.getByText('PDF export')).toBeTruthy()

    // Click JSON export
    fireEvent.click(screen.getByText('JSON export'))
    expect(onExportJson).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()

    // Reopen and click PDF export
    fireEvent.click(downloadBtn)
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.click(screen.getByText('PDF export'))
    expect(onExportPdf).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes export menu on Escape key', () => {
    render(
      <Toolbar
        fileName="sample.pdf"
        numPages={5}
        onBack={vi.fn()}
        onJumpToPage={vi.fn()}
        onUndo={vi.fn()}
        canUndo={false}
        search={mockSearch}
      />
    )

    const downloadBtn = screen.getByLabelText('Download options')
    fireEvent.click(downloadBtn)
    expect(screen.getByRole('menu')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()
  })
})
