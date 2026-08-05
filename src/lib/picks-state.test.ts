import { describe, expect, it } from 'vitest'

import {
  getRejuvenatedRelicOptions,
  getRejuvenatedRelicTier,
  normalizeRejuvenatedRelic,
} from './picks-state'

describe('Rejuvenated relic picks', () => {
  it('offers every relic from tiers below Rejuvenated', () => {
    const selectedRelics = { 6: '6a' }

    expect(getRejuvenatedRelicTier(selectedRelics, true)).toBe(6)
    expect(
      getRejuvenatedRelicOptions(selectedRelics, true).map(({ id }) => id),
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

    expect(normalizeRejuvenatedRelic('1b', selectedRelics, true)).toBe('1b')
    expect(normalizeRejuvenatedRelic('1a', selectedRelics, true)).toBe('')
    expect(normalizeRejuvenatedRelic('6b', selectedRelics, true)).toBe('')
    expect(normalizeRejuvenatedRelic('7a', selectedRelics, true)).toBe('')
  })

  it('removes the bonus pick when Rejuvenated is no longer selected', () => {
    expect(normalizeRejuvenatedRelic('1b', { 6: '6b' }, true)).toBe('')
    expect(getRejuvenatedRelicTier({ 6: '6b' }, true)).toBeUndefined()
  })
})
