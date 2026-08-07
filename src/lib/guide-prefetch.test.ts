import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  guidePrefetchAllowed,
  guideUsesDataTable,
} from './guide-prefetch'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('guide prefetch policy', () => {
  it('preloads the table runtime only for region detail guides', () => {
    expect(guideUsesDataTable('/leagues/regions/desert')).toBe(true)
    expect(guideUsesDataTable('/leagues/regions/starting-regions')).toBe(true)
    expect(guideUsesDataTable('/leagues/regions')).toBe(false)
    expect(guideUsesDataTable('/leagues/regions/overview')).toBe(false)
    expect(guideUsesDataTable('/guides/early-game/desert-treasure')).toBe(false)
  })

  it('respects data saver and slow connections', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } })
    expect(guidePrefetchAllowed()).toBe(false)

    vi.stubGlobal('navigator', { connection: { effectiveType: 'slow-2g' } })
    expect(guidePrefetchAllowed()).toBe(false)

    vi.stubGlobal('navigator', { connection: { effectiveType: '4g' } })
    expect(guidePrefetchAllowed()).toBe(true)
  })
})
