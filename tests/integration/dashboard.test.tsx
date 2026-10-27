import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { DashboardPage } from '@features/dashboard'
import { LibraryPage } from '@features/library/pages/LibraryPage'

function renderWithRoutes(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/edit-pdf" element={<LibraryPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DashboardPage', () => {
  it('renders the product dashboard with all four tools', () => {
    renderWithRoutes(['/'])

    expect(screen.getByRole('heading', { level: 1, name: /all your pdf tools/i })).toBeTruthy()

    expect(screen.getByText('Edit PDF')).toBeTruthy()
    expect(screen.getByText('Merge PDF')).toBeTruthy()
    expect(screen.getByText('PDF to Word')).toBeTruthy()
    expect(screen.getByText('Word to PDF')).toBeTruthy()

    expect(screen.getByText('Ready to Use')).toBeTruthy()
    expect(screen.getAllByText('Coming Soon').length).toBeGreaterThanOrEqual(3)
  })

  it('clicking Edit PDF navigates to the library editor view', () => {
    renderWithRoutes(['/'])

    const editPdfLink = screen.getByRole('link', { name: /Edit PDF/i })
    expect(editPdfLink.getAttribute('href')).toBe('/edit-pdf')

    fireEvent.click(editPdfLink)

    // Should now show the library page ("whatever current dashboard shows")
    expect(screen.getByRole('heading', { level: 1, name: /Your library/i })).toBeTruthy()
    expect(screen.getByLabelText(/Import PDF files/i)).toBeTruthy()
  })

  it('clicking an inactive option opens the Coming Soon modal', () => {
    renderWithRoutes(['/'])

    const mergePdfButton = screen.getByRole('button', { name: /Merge PDF/i })
    fireEvent.click(mergePdfButton)

    // Modal dialog is displayed
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Merge PDF' })).toBeTruthy()
    expect(screen.getByText(/We are working to bring local-first merge pdf/i)).toBeTruthy()

    // Dismiss with Got it
    const gotItButton = screen.getByRole('button', { name: 'Got it' })
    fireEvent.click(gotItButton)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('inactive options modal can navigate to PDF editor', () => {
    renderWithRoutes(['/'])

    const wordToPdfButton = screen.getByRole('button', { name: /Word to PDF/i })
    fireEvent.click(wordToPdfButton)

    expect(screen.getByRole('dialog')).toBeTruthy()
    const openEditorButton = screen.getByRole('button', { name: 'Open PDF Editor' })
    fireEvent.click(openEditorButton)

    // Navigated to /edit-pdf
    expect(screen.getByRole('heading', { level: 1, name: /Your library/i })).toBeTruthy()
  })

  it('in LibraryPage, All tools button navigates back to dashboard', () => {
    renderWithRoutes(['/edit-pdf'])

    expect(screen.getByRole('heading', { level: 1, name: /Your library/i })).toBeTruthy()

    const allToolsLink = screen.getByRole('link', { name: /Back to dashboard tools/i })
    expect(allToolsLink.getAttribute('href')).toBe('/')

    fireEvent.click(allToolsLink)

    expect(screen.getByRole('heading', { level: 1, name: /all your pdf tools/i })).toBeTruthy()
  })
})
