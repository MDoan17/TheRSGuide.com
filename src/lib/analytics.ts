const RYBBIT_SCRIPT_ID = "rybbit-analytics"
const PRIVATE_PLAYER_NAME_SELECTOR = "[data-private-player-name]"

declare global {
  interface Window {
    __RYBBIT_OPTOUT__?: boolean
    rybbit?: {
      stopSessionReplay?: () => void
    }
  }
}

function enableAnalytics(sessionReplay: boolean) {
  window.__RYBBIT_OPTOUT__ = false
  if (document.getElementById(RYBBIT_SCRIPT_ID)) return

  const script = document.createElement("script")
  script.id = RYBBIT_SCRIPT_ID
  script.src = "https://analytics.distortion.me/api/script.js"
  script.async = true
  script.dataset.siteId = "d8c35c481bf4"
  script.dataset.replaySampleRate = sessionReplay ? "100" : "0"
  script.dataset.replayMaskAllInputs = "true"
  script.dataset.replayCollectFonts = "false"
  script.dataset.replayMaskTextSelectors = JSON.stringify([
    PRIVATE_PLAYER_NAME_SELECTOR,
  ])
  document.head.append(script)
}

function disableAnalytics() {
  window.rybbit?.stopSessionReplay?.()
  window.__RYBBIT_OPTOUT__ = true
}

export {
  disableAnalytics,
  enableAnalytics,
  PRIVATE_PLAYER_NAME_SELECTOR,
  RYBBIT_SCRIPT_ID,
}
