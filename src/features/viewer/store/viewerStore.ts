import { create } from 'zustand'
import { clampScale, zoomIn, zoomOut } from '../lib/zoom'

export type Tool = 'select' | 'highlight' | 'note'
export type SidebarTab = 'thumbnails' | 'annotations'
export type FitMode = 'fit' | 'custom'

type ViewerState = {
  scale: number
  fitMode: FitMode
  tool: Tool
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  currentPage: number
  /** User-driven zoom: also leaves fit mode. */
  setScale: (scale: number) => void
  /** Layout-driven zoom: keeps the active fit mode. */
  applyScale: (scale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  setFitMode: (mode: FitMode) => void
  setTool: (tool: Tool) => void
  toggleSidebar: () => void
  setSidebarTab: (tab: SidebarTab) => void
  setCurrentPage: (page: number) => void
  reset: () => void
}

const initial = {
  scale: 1,
  fitMode: 'fit' as FitMode,
  tool: 'select' as Tool,
  sidebarOpen: true,
  sidebarTab: 'thumbnails' as SidebarTab,
  currentPage: 1
}

/** UI-only state shared by the reader toolbar, sidebar and page views. */
export const useViewerStore = create<ViewerState>((set) => ({
  ...initial,
  setScale: (scale) => set({ scale: clampScale(scale), fitMode: 'custom' }),
  applyScale: (scale) => set({ scale: clampScale(scale) }),
  zoomIn: () => set((state) => ({ scale: zoomIn(state.scale), fitMode: 'custom' })),
  zoomOut: () => set((state) => ({ scale: zoomOut(state.scale), fitMode: 'custom' })),
  setFitMode: (fitMode) => set({ fitMode }),
  setTool: (tool) => set({ tool }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  reset: () => set(initial)
}))
