const RYBBIT_SCRIPT_ID = "rybbit-analytics"
const RYBBIT_OPT_OUT_KEY = "disable-rybbit"
const RYBBIT_STORAGE_KEYS = [
  "rybbit-visitor-id",
  "rybbit-user-id",
  "rybbit-replay-sampled",
] as const

declare global {
  interface Window {
    __RYBBIT_OPTOUT__?: boolean
    rybbit?: {
      cleanup?: () => void
      clearUserId?: () => void
      stopSessionReplay?: () => void
    }
  }
}

function enableAnalytics() {
  window.localStorage.removeItem(RYBBIT_OPT_OUT_KEY)
  window.__RYBBIT_OPTOUT__ = false
  if (document.getElementById(RYBBIT_SCRIPT_ID)) return

  const script = document.createElement("script")
  script.id = RYBBIT_SCRIPT_ID
  script.src = "https://analytics.distortion.me/api/script.js"
  script.async = true
  script.dataset.siteId = "d8c35c481bf4"
  document.head.append(script)
}

function clearAnalyticsStorage() {
  window.rybbit?.clearUserId?.()
  for (const key of RYBBIT_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
    window.sessionStorage.removeItem(key)
  }
}

function disableAnalytics({ forget = false, persist = false } = {}) {
  window.rybbit?.stopSessionReplay?.()
  window.rybbit?.cleanup?.()
  window.__RYBBIT_OPTOUT__ = true
  if (persist) window.localStorage.setItem(RYBBIT_OPT_OUT_KEY, "true")
  if (forget) clearAnalyticsStorage()
}

export {
  clearAnalyticsStorage,
  disableAnalytics,
  enableAnalytics,
  RYBBIT_OPT_OUT_KEY,
  RYBBIT_STORAGE_KEYS,
  RYBBIT_SCRIPT_ID,
}
