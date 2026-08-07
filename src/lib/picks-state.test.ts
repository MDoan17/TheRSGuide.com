import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  PICKS_STORAGE_KEY,
  getRejuvenatedRelicOptions,
  getRejuvenatedRelicTier,
  loadPicksState,
  normalizeRejuvenatedRelic,
} from './picks-state'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('confirmed relic migration', () => {
  it('preserves the relic names selected in the old Tier 1 order', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) =>
          key === PICKS_STORAGE_KEY
            ? JSON.stringify({
                isSpeculativeRelics: false,
                selectedRelics: { 1: '1a' },
              })
            : null,
      },
    })

    expect(loadPicksState().selectedRelics).toEqual({ 1: '1c' })
  })

  it('preserves relic names from the old speculative slot order', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) =>
          key === PICKS_STORAGE_KEY
            ? JSON.stringify({
                isSpeculativeRelics: true,
                selectedRelics: { 4: '4b', 5: '5a', 7: '7a' },
              })
            : null,
      },
    })

    expect(loadPicksState().selectedRelics).toEqual({
      4: '4c',
      5: '5b',
      7: '7b',
    })
  })
})

describe('Rejuvenated relic picks', () => {
  it('offers every relic from tiers below Rejuvenated', () => {
    const selectedRelics = { 6: '6a' }

    expect(getRejuvenatedRelicTier(selectedRelics)).toBe(6)
    expect(
      getRejuvenatedRelicOptions(selectedRelics).map(({ id }) => id),
    ).toEqual([
      '1a', '1b', '1c',
      '2a', '2b', '2c',
      '3a', '3b', '3c',
      '4a', '4b', '4c',
      '5a', '5b', '5c',
    ])
  })

  it('accepts lower-tier bonus picks and rejects invalid or duplicate picks', () => {
    const selectedRelics = { 1: '1a', 6: '6a' }

    expect(normalizeRejuvenatedRelic('1b', selectedRelics)).toBe('1b')
    expect(normalizeRejuvenatedRelic('1a', selectedRelics)).toBe('')
    expect(normalizeRejuvenatedRelic('6b', selectedRelics)).toBe('')
    expect(normalizeRejuvenatedRelic('7a', selectedRelics)).toBe('')
  })

  it('removes the bonus pick when Rejuvenated is no longer selected', () => {
    expect(normalizeRejuvenatedRelic('1b', { 6: '6b' })).toBe('')
    expect(getRejuvenatedRelicTier({ 6: '6b' })).toBeUndefined()
  })
})
