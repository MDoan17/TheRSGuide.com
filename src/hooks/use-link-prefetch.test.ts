import { describe, expect, it } from 'vitest'

import { shouldCancelDwell } from './use-link-prefetch'

describe('link prefetch hover intent', () => {
  it('cancels a pending prefetch when the pointer leaves its link', () => {
    expect(shouldCancelDwell('/guides/melee', '/guides/melee', null)).toBe(true)
    expect(
      shouldCancelDwell('/guides/melee', '/guides/melee', '/guides/magic'),
    ).toBe(true)
  })

  it('keeps the timer while moving between children of the same link', () => {
    expect(
      shouldCancelDwell('/guides/melee', '/guides/melee', '/guides/melee'),
    ).toBe(false)
  })
})
