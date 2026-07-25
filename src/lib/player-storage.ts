import { normalizeUsername } from '@/lib/player-profile'

interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface PlayerStorage {
  loadLastSearch(): string
  saveLastSearch(username: string): void
  loadManualCompletions(username: string): ReadonlySet<string>
  saveManualCompletions(username: string, paths: ReadonlySet<string>): void
}

const LAST_SEARCH_KEY = 'rs3_player_search'
const MANUAL_COMPLETION_PREFIX = 'rs3-manual-progression:v1:'

export const createPlayerStorage = (getStorage: () => KeyValueStorage | null): PlayerStorage => {
  const storage = () => {
    try {
      return getStorage()
    } catch {
      return null
    }
  }
  const manualKey = (username: string) =>
    `${MANUAL_COMPLETION_PREFIX}${normalizeUsername(username).toLowerCase()}`

  return {
    loadLastSearch() {
      return normalizeUsername(storage()?.getItem(LAST_SEARCH_KEY) ?? '')
    },
    saveLastSearch(username) {
      storage()?.setItem(LAST_SEARCH_KEY, normalizeUsername(username))
    },
    loadManualCompletions(username) {
      try {
        const parsed = JSON.parse(storage()?.getItem(manualKey(username)) ?? '[]')
        return new Set(
          Array.isArray(parsed)
            ? parsed.filter((path): path is string => typeof path === 'string')
            : [],
        )
      } catch {
        return new Set()
      }
    },
    saveManualCompletions(username, paths) {
      storage()?.setItem(manualKey(username), JSON.stringify([...paths]))
    },
  }
}

export const browserPlayerStorage = createPlayerStorage(() =>
  typeof window === 'undefined' ? null : window.localStorage
)
