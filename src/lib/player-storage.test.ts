import { describe, expect, it } from 'vitest'
import { createPlayerStorage } from './player-storage'

const memoryStorage = () => {
  const values = new Map<string, string>()
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  }
}

describe('player storage adapter', () => {
  it('normalizes the last search and scopes manual progress by account', () => {
    const memory = memoryStorage()
    const storage = createPlayerStorage(() => memory.storage)

    storage.saveLastSearch('  The RS Guy  ')
    storage.saveManualCompletions('The RS Guy', new Set(['/one', '/two']))

    expect(storage.loadLastSearch()).toBe('The RS Guy')
    expect([...storage.loadManualCompletions('the rs guy')]).toEqual(['/one', '/two'])
    expect([...storage.loadManualCompletions('another player')]).toEqual([])
  })

  it('contains malformed browser data behind an empty completion set', () => {
    const memory = memoryStorage()
    memory.values.set('rs3-manual-progression:v1:player', '{broken')
    const storage = createPlayerStorage(() => memory.storage)

    expect([...storage.loadManualCompletions('Player')]).toEqual([])
  })
})
