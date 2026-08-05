import relicData from '../src/data/leagues-ii/relics.json'

const UNKNOWN_RELIC_ICON =
  'https://media.thersguide.com/leagues-2/relics/unknown.png'
const OPTION_LETTERS = ['a', 'b', 'c'] as const

type RelicRecord = (typeof relicData.Relics)[number]
type SpeculativeSlot = {
  label?: string
  relicName?: RelicRecord['name']
}

const relicByName = new Map(
  relicData.Relics.map((relic) => [relic.name, relic] as const),
)

// Picker-only estimates transcribed from preview footage. Confirmed relic tiers
// continue to come exclusively from relics.json's `tier` field.
const SPECULATIVE_LAYOUT: readonly (readonly SpeculativeSlot[])[] = [
  [
    { relicName: 'Endless Harvest' },
    { relicName: 'Golden Touch' },
    { relicName: 'Survivalist' },
  ],
  [
    { relicName: 'Animal Wrangler' },
    { relicName: 'Superheated' },
    { relicName: 'Divine Druid' },
  ],
  [
    { relicName: "Nature's Network" },
    { relicName: "Assassin's Insight" },
    { relicName: 'Voidwalker' },
  ],
  [
    { relicName: 'Crystal Grace' },
    { relicName: 'Antiquarian' },
    { relicName: 'Transmutation' },
  ],
  [
    { relicName: 'Production Master' },
    { label: 'Unknown relic' },
    { relicName: 'Devout' },
  ],
  [
    { relicName: 'Rejuvenated' },
    { relicName: 'Perkfection' },
  ],
  [
    { relicName: 'Naragi Edict' },
    { label: 'Unknown relic' },
    { relicName: 'Icyenic Faith' },
  ],
] as const

export const SPECULATIVE_RELIC_TIERS = SPECULATIVE_LAYOUT.map(
  (slots, tierIndex) => ({
    tier: tierIndex + 1,
    optionCount: slots.length,
    options: slots.map((slot, optionIndex) => {
      const relic = slot.relicName
        ? relicByName.get(slot.relicName)
        : undefined
      if (slot.relicName && !relic) {
        throw new Error(`Unknown speculative relic: ${slot.relicName}`)
      }
      const letter = OPTION_LETTERS[optionIndex]!
      const label = relic?.name ?? slot.label ?? 'Unknown relic'

      return {
        description: relic
          ? `${relic.tagline} Placement is speculative.`
          : `${label} is a best-guess category from preview footage. Its name, effects, and placement are unconfirmed.`,
        icon: relic?.image ?? UNKNOWN_RELIC_ICON,
        id: `${tierIndex + 1}${letter}`,
        label,
      }
    }),
  }),
)
