import { useEffect } from 'react'
import { useViewerStore } from '../store/viewerStore'
import { zoomIn, zoomOut } from '../lib/zoom'

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

/**
 * Reader keyboard shortcuts (Acrobat-ish): arrows navigate, +/- zoom, v/h/n tools,
 * Ctrl/Cmd+Z undoes the last annotation.
 */
export function useReaderShortcuts(
  jumpToPage: (page: number) => void,
  clearSearch: () => void,
  undo: () => void
) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return

      const store = useViewerStore.getState()
      const { currentPage, setCurrentPage } = store

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
        return
      }

      switch (event.key) {
        case 'ArrowRight':
        case 'PageDown':
          event.preventDefault()
          setCurrentPage(currentPage + 1)
          jumpToPage(currentPage + 1)
          break
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault()
          setCurrentPage(Math.max(1, currentPage - 1))
          jumpToPage(Math.max(1, currentPage - 1))
          break
        case '+':
        case '=':
          store.setScale(zoomIn(store.scale))
          break
        case '-':
          store.setScale(zoomOut(store.scale))
          break
        case 'v':
          store.setTool('select')
          break
        case 'h':
          store.setTool('highlight')
          break
        case 'n':
          store.setTool('note')
          break
        case 'Escape':
          clearSearch()
          store.setTool('select')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clearSearch, jumpToPage, undo])
}
