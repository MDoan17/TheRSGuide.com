import { z } from 'zod'

import relicData from '../src/data/leagues-ii/relics.json'
import rawLeagueOptions from './league-options.json'

const hexColorSchema = z.string().regex(/^#[0-9A-F]{6}$/i)
const optionSchema = z.object({
  id: z.string().min(1),
  icon: z.string().min(1).optional(),
  label: z.string().min(1),
})
const relicOptionSchema = optionSchema.extend({
  description: z.string().min(1).optional(),
})

const staticLeagueOptionsSchema = z.object({
  regions: z.array(
    optionSchema.extend({
      color: hexColorSchema,
      regionIds: z.array(z.string().min(1)).min(1),
      voteEligible: z.boolean(),
    }),
  ).min(1),
  blessings: z.array(
    optionSchema.extend({
      shortLabel: z.string().length(1),
      path: z.string().min(1),
      color: hexColorSchema,
      darkColor: hexColorSchema,
    }),
  ).length(3),
})

const relicSheetSchema = z.object({
  Relics: z.array(
    z.object({
      name: z.string().min(1),
      tagline: z.string().min(1),
      tier: z.number().int().min(0),
      image: z.string().url(),
    }),
  ),
})

const staticLeagueOptions = staticLeagueOptionsSchema.parse(rawLeagueOptions)
const relicSheet = relicSheetSchema.parse(relicData)
const RELIC_TIER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const
const OPTION_LETTERS = ['a', 'b', 'c'] as const

const relicTiers = RELIC_TIER_NUMBERS.map((tier) => {
  const optionCount = tier === 7 ? 2 : 3
  const knownRelics = relicSheet.Relics.filter((relic) => relic.tier === tier)
    .slice(0, optionCount)

  return {
    tier,
    options: Array.from({ length: optionCount }, (_, optionIndex) => {
      const relic = knownRelics[optionIndex]
      const letter = OPTION_LETTERS[optionIndex]!
      return relicOptionSchema.parse({
        id: `${tier}${letter}`,
        label: relic?.name ?? `Tier ${tier} relic ${letter.toUpperCase()}`,
        description: relic?.tagline ?? 'This relic has not been revealed yet.',
        icon: relic?.image,
      })
    }),
  }
})

export const LEAGUE_OPTIONS = {
  ...staticLeagueOptions,
  relicTiers,
}
export const VOTE_REGIONS = LEAGUE_OPTIONS.regions.filter(
  (region) => region.voteEligible,
)
const CURRENT_REGION_IDS = new Set(
  LEAGUE_OPTIONS.regions.map((region) => region.id),
)
const LEGACY_REGION_ID_ALIASES: Readonly<Record<string, string>> = {
  'city-of-um': 'misthalin-havenhythe',
  daemonheim: 'wilderness',
  'feldip-hills': 'kandarin',
  havenhythe: 'misthalin-havenhythe',
  'kandarin-feldip-hills': 'kandarin',
  misthalin: 'misthalin-havenhythe',
  'misthalin-city-of-um-havenhythe': 'misthalin-havenhythe',
  'troll-country': 'asgarnia',
  'troll-country-asgarnia': 'asgarnia',
  'troll-country-fremennik-providence': 'fremennik-providence',
  'wilderness-daemonheim': 'wilderness',
}

export function normalizeLeagueRegionIds(regionIds: readonly string[]) {
  return Array.from(
    new Set(
      regionIds
        .map((regionId) => LEGACY_REGION_ID_ALIASES[regionId] ?? regionId)
        .filter((regionId) => CURRENT_REGION_IDS.has(regionId)),
    ),
  )
}

export type LeagueOption = z.infer<typeof optionSchema>
export type LeagueOptions = typeof LEAGUE_OPTIONS

