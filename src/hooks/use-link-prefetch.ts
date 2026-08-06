import { useEffect } from "react"

import { preloadGuide } from "@/lib/content"

const IMMEDIATE_INTENT_EVENTS = ["focusin", "touchstart"] as const
const HOVER_DWELL_MS = 60
const SLOW_CONNECTION = /(^| )(slow-)?2g$/

type NetworkInformation = {
  effectiveType?: string
  saveData?: boolean
}

const networkInformation = (): NetworkInformation | undefined =>
  (navigator as Navigator & { connection?: NetworkInformation }).connection

const prefetchAllowed = () => {
  const connection = networkInformation()
  if (!connection) return true
  if (connection.saveData) return false
  return !SLOW_CONNECTION.test(connection.effectiveType ?? "")
}

const guidePathFromEvent = (event: Event): string | null => {
  const target = event.target
  if (!(target instanceof Element)) return null

  const anchor = target.closest("a")
  if (!anchor) return null
  if (anchor.hasAttribute("download")) return null
  if (anchor.target && anchor.target !== "_self") return null

  const href = anchor.getAttribute("href")
  if (!href || href.startsWith("#")) return null

  let url: URL
  try {
    url = new URL(href, window.location.href)
  } catch {
    return null
  }
  if (url.origin !== window.location.origin) return null

  return url.pathname === "/"
    ? url.pathname
    : url.pathname.replace(/\/+$/, "")
}

function useLinkPrefetch() {
  useEffect(() => {
    if (!prefetchAllowed()) return

    const prefetched = new Set<string>()
    let pendingPath: string | null = null
    let dwellTimer: ReturnType<typeof setTimeout> | undefined

    const prefetch = (path: string) => {
      if (prefetched.has(path)) return
      prefetched.add(path)
      preloadGuide(path)
    }

    const cancelDwell = () => {
      clearTimeout(dwellTimer)
      dwellTimer = undefined
      pendingPath = null
    }

    // pointerover fires again for every child element, so comparing the
    // resolved path rather than the event target keeps a hover that merely
    // crosses a link's own markup from restarting the timer.
    const handleHover = (event: Event) => {
      const path = guidePathFromEvent(event)
      if (path === pendingPath) return
      cancelDwell()
      if (!path || prefetched.has(path)) return
      pendingPath = path
      dwellTimer = setTimeout(() => {
        cancelDwell()
        prefetch(path)
      }, HOVER_DWELL_MS)
    }

    const handleIntent = (event: Event) => {
      const path = guidePathFromEvent(event)
      if (path) prefetch(path)
    }

    document.addEventListener("pointerover", handleHover, { passive: true })
    for (const type of IMMEDIATE_INTENT_EVENTS) {
      document.addEventListener(type, handleIntent, { passive: true })
    }
    return () => {
      cancelDwell()
      document.removeEventListener("pointerover", handleHover)
      for (const type of IMMEDIATE_INTENT_EVENTS) {
        document.removeEventListener(type, handleIntent)
      }
    }
  }, [])
}

export { useLinkPrefetch }
