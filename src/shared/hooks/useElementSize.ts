import { useEffect, useState } from 'react'

type Size = { width: number; height: number }

/** Observe an element's content box; used for fit-to-width zoom. */
export function useElementSize<T extends HTMLElement>(ref: React.RefObject<T | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize((current) =>
        current.width === width && current.height === height ? current : { width, height }
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
