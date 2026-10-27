import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DashboardPage } from '@features/dashboard'
import { LibraryPage } from '@features/library/pages/LibraryPage'
import { ReaderPage } from '@features/viewer/pages/ReaderPage'
import { useThemeSync } from '@features/settings'

export function App() {
  // Keeps <html data-theme> in step with the saved preference.
  useThemeSync()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/edit-pdf" element={<LibraryPage />} />
        <Route path="/library" element={<Navigate to="/edit-pdf" replace />} />
        <Route path="/edit" element={<Navigate to="/edit-pdf" replace />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
