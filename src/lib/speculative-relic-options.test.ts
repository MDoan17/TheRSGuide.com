import { describe, expect, it } from 'vitest'

import relicData from '@/data/leagues-ii/relics.json'
import { LEAGUE_OPTIONS } from '../../shared/league-options'
import { REQUIRED_RELIC_COUNT } from '../../shared/share-contract'
import { SPECULATIVE_RELIC_TIERS } from '../../shared/speculative-relic-options'

const labelsForTier = (tier: number) =>
  SPECULATIVE_RELIC_TIERS.find((entry) => entry.tier === tier)?.options.map(
    (option) => option.label,
  )

describe('speculative relic options', () => {
  it('uses seven relic tiers with two options only in tier 6', () => {
    expect(REQUIRED_RELIC_COUNT).toBe(7)
    expect(LEAGUE_OPTIONS.relicTiers).toHaveLength(7)
    expect(SPECULATIVE_RELIC_TIERS).toHaveLength(7)

    for (const tier of SPECULATIVE_RELIC_TIERS) {
      expect(tier.options).toHaveLength(tier.tier === 6 ? 2 : 3)
    }
  })

  it('matches the best-guess placements from the preview image', () => {
    expect(labelsForTier(1)).toEqual([
      'Endless Harvest',
      'Golden Touch',
      'Survivalist',
    ])
    expect(labelsForTier(2)).toEqual([
      'Animal Wrangler',
      'Superheated',
      'Unknown relic',
    ])
    expect(labelsForTier(3)).toEqual([
      "Nature's Network",
      "Assassin's Insight",
      'Voidwalker',
    ])
    expect(labelsForTier(4)).toEqual([
      'Crystal Grace',
      'Divine Druid',
      'Transmutation',
    ])
    expect(labelsForTier(5)).toEqual([
      'Unknown relic',
      'Unknown relic',
      'Devout',
    ])
    expect(labelsForTier(6)).toEqual(['Rejuvenated', 'Perkfection'])
    expect(labelsForTier(7)).toEqual([
      'Unknown relic',
      'Unknown relic',
      'Icyenic Faith',
    ])
  })

  it('does not promote speculative placements into confirmed relic data', () => {
    const speculativeKnownRelics = [
      'Animal Wrangler',
      'Superheated',
      "Nature's Network",
      "Assassin's Insight",
      'Voidwalker',
      'Crystal Grace',
      'Divine Druid',
      'Transmutation',
      'Icyenic Faith',
    ]

    expect(
      relicData.Relics.filter((relic) =>
        speculativeKnownRelics.includes(relic.name),
      ).every((relic) => relic.tier === 0),
    ).toBe(true)
  })

  it('uses the unknown artwork for every unnamed speculative slot', () => {
    const unknownImage =
      'https://media.thersguide.com/leagues-2/relics/unknown.png'
    const namedRelics = new Set(relicData.Relics.map((relic) => relic.name))

    for (const option of SPECULATIVE_RELIC_TIERS.flatMap(
      (tier) => tier.options,
    )) {
      if (!namedRelics.has(option.label)) {
        expect(option.icon).toBe(unknownImage)
      }
    }
  })
})
