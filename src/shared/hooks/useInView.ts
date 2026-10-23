import { useEffect, useState } from 'react'

/**
 * True once the element is within `rootMargin` of the viewport. Used to defer
 * canvas/text rendering for pages the user cannot see yet.
 */
export function useInView<T extends Element>(
  ref: React.RefObject<T | null>,
  rootMargin = '600px'
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setInView(entry.isIntersecting)
      },
      { rootMargin }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref, rootMargin])

  return inView
}
