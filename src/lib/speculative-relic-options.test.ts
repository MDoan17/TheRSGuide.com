import { describe, expect, it } from 'vitest'

import { REQUIRED_RELIC_COUNT } from '../../shared/share-contract'
import { SPECULATIVE_RELIC_TIERS } from '../../shared/speculative-relic-options'

describe('speculative relic options', () => {
  it('stays compatible with the share contract without duplicating its content', () => {
    expect(SPECULATIVE_RELIC_TIERS).toHaveLength(REQUIRED_RELIC_COUNT)

    const optionIds = new Set<string>()
    for (const [tierIndex, tier] of SPECULATIVE_RELIC_TIERS.entries()) {
      expect(tier.tier).toBe(tierIndex + 1)
      expect(tier.options).toHaveLength(tier.optionCount)

      for (const option of tier.options) {
        expect(option.id).toMatch(new RegExp(`^${tier.tier}[a-c]$`))
        expect(option.label.trim()).not.toBe('')
        expect(option.description.trim()).not.toBe('')
        expect(option.icon).toMatch(/^https:\/\//)
        expect(optionIds.has(option.id)).toBe(false)
        optionIds.add(option.id)
      }
    }
  })

  it('keeps the current named speculative placements', () => {
    const labelsForTier = (tier: number) =>
      SPECULATIVE_RELIC_TIERS[tier - 1]?.options.map(({ label }) => label)

    expect(labelsForTier(2)).toContain('Divine Druid')
    expect(labelsForTier(4)).toContain('Antiquarian')
    expect(labelsForTier(4)).not.toContain('Divine Druid')
    expect(labelsForTier(5)).toContain('Production Master')
    expect(labelsForTier(7)).toContain('Naragi')
  })
})
