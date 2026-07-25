import Player from '@vimeo/player'
import type {
  BackgroundMediaPlayerAdapter,
  BackgroundMediaPreferenceAdapter,
} from '@/lib/background-media'

const ENABLED_PREFERENCE_KEY = 'home-background-video'
const PLAYBACK_EVENTS = ['play', 'playing', 'timeupdate'] as const

export const vimeoBackgroundMediaAdapter: BackgroundMediaPlayerAdapter<HTMLIFrameElement> = {
  create(target) {
    const player = new Player(target)
    return {
      ready: () => player.ready().then(() => undefined),
      isPaused: () => player.getPaused(),
      setVolume: (volume) => player.setVolume(volume).then(() => undefined),
      onPlayback(listener) {
        for (const event of PLAYBACK_EVENTS) player.on(event, listener)
        return () => {
          for (const event of PLAYBACK_EVENTS) player.off(event, listener)
        }
      },
      dispose() {
        for (const event of PLAYBACK_EVENTS) player.off(event)
      },
    }
  },
}

export const browserBackgroundMediaPreferences: BackgroundMediaPreferenceAdapter = {
  loadEnabled() {
    if (typeof window === 'undefined') return false
    const savedPreference = window.localStorage.getItem(ENABLED_PREFERENCE_KEY)
    if (savedPreference !== null) return savedPreference === 'true'
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  saveEnabled(enabled) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ENABLED_PREFERENCE_KEY, String(enabled))
    }
  },
}
