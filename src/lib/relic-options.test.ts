import { describe, expect, it } from 'vitest'

import relicData from '@/data/leagues-ii/relics.json'
import { LEAGUE_OPTIONS } from '../../shared/league-options'
import { REQUIRED_RELIC_COUNT } from '../../shared/share-contract'

describe('relic options', () => {
  it('assigns every relic to the confirmed tier and slot layout', () => {
    expect(LEAGUE_OPTIONS.relicTiers).toHaveLength(REQUIRED_RELIC_COUNT)
    expect(relicData.Relics.every(({ tier }) => tier >= 1 && tier <= 7)).toBe(true)

    const labelsByTier = LEAGUE_OPTIONS.relicTiers.map(({ options }) =>
      options.map(({ label }) => label),
    )

    expect(labelsByTier).toEqual([
      ['Endless Harvest', 'Golden Touch', 'Survivalist'],
      ['Animal Wrangler', 'Superheated', 'Divine Druid'],
      ["Nature's Network", "Assassin's Insight", 'Voidwalker'],
      ['Crystal Grace', 'Transmutation', 'Antiquarian'],
      ['Clue Connoisseur', 'Production Master', 'Devout'],
      ['Rejuvenated', 'Perkfection'],
      ['Infernal Fire', 'Naragi Edict', 'Icyenic Faith'],
    ])
  })

  it('keeps the picker IDs and assets complete', () => {
    const optionIds = new Set<string>()

    for (const tier of LEAGUE_OPTIONS.relicTiers) {
      for (const option of tier.options) {
        expect(option.id).toMatch(new RegExp(`^${tier.tier}[a-c]$`))
        expect(option.description?.trim()).not.toBe('')
        expect(option.icon).toMatch(/^https:\/\//)
        expect(optionIds.has(option.id)).toBe(false)
        optionIds.add(option.id)
      }
    }
  })
})
