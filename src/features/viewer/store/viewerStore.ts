import { create } from 'zustand'
import { clampScale, zoomIn, zoomOut } from '../lib/zoom'

export type Tool = 'select' | 'highlight' | 'note'
export type SidebarTab = 'thumbnails' | 'annotations'

type ViewerState = {
  scale: number
  /** True until the reader zooms manually; while true the layout keeps fitting the width. */
  autoFit: boolean
  tool: Tool
  sidebarOpen: boolean
  sidebarTab: SidebarTab
  currentPage: number
  setScale: (scale: number) => void
  /** Layout-driven zoom: does not count as a manual zoom. */
  applyScale: (scale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  setTool: (tool: Tool) => void
  toggleSidebar: () => void
  setSidebarTab: (tab: SidebarTab) => void
  setCurrentPage: (page: number) => void
  reset: () => void
}

const initial = {
  scale: 1,
  autoFit: true,
  tool: 'select' as Tool,
  sidebarOpen: true,
  sidebarTab: 'thumbnails' as SidebarTab,
  currentPage: 1
}

/** UI-only state shared by the reader toolbar, sidebar and page views. */
export const useViewerStore = create<ViewerState>((set) => ({
  ...initial,
  setScale: (scale) => set({ scale: clampScale(scale), autoFit: false }),
  applyScale: (scale) => set({ scale: clampScale(scale) }),
  zoomIn: () => set((state) => ({ scale: zoomIn(state.scale), autoFit: false })),
  zoomOut: () => set((state) => ({ scale: zoomOut(state.scale), autoFit: false })),
  setTool: (tool) => set({ tool }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  reset: () => set(initial)
}))
