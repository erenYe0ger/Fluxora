import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LibraryPage } from '@features/library/pages/LibraryPage'
import { ReaderPage } from '@features/viewer/pages/ReaderPage'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
