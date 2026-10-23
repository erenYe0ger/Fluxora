import { useEffect } from 'react'
import { useSettingsStore } from './store'
import type { Theme } from './store'

/** The theme lives on <html data-theme>, so CSS tokens (and pdf.js page chrome) follow. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
}

export function useThemeSync(): void {
  const theme = useSettingsStore((state) => state.theme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])
}
