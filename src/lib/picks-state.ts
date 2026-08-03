import {
  OPTIONAL_REGION_PICK_COUNT,
  type SharedBuild,
} from '../../shared/share-contract'
import {
  SELECTABLE_BLESSING_TIERS,
  blessingSelectionsFromArray,
  createLegacyBlessingSelections,
  isBlessingId,
  type BlessingSelections,
} from '../../shared/blessings'
import {
  LEAGUE_OPTIONS,
  normalizeLeagueRegionIds,
} from '../../shared/league-options'

export {
  OPTIONAL_REGION_PICK_COUNT,
} from '../../shared/share-contract'
export {
  BLESSING_IDS,
  BLESSING_SELECTION_COUNT,
  BLESSING_TIERS,
  GOD_BLESSING_TIERS,
  SELECTABLE_BLESSING_TIERS,
  blessingSelectionsToArray,
  deriveGodBlessing,
  getBlessingForTier,
  getResolvedBlessingCount,
  isBlessingTreeComplete,
  type BlessingId,
  type BlessingSelections,
  type BlessingTier,
  type GodBlessingTier,
  type SelectableBlessingTier,
} from '../../shared/blessings'

export const DEFAULT_REGION_ID = 'misthalin-havenhythe'
export const KARAMJA_REGION_ID = 'karamja'
export const GUARANTEED_REGION_IDS = [DEFAULT_REGION_ID, KARAMJA_REGION_ID]

export const RELIC_TIERS = LEAGUE_OPTIONS.relicTiers.map((tier) => ({
  ...tier,
  optionCount: tier.options.length,
}))
export const PICKS_STORAGE_KEY = 'rs3-leagues-planner-state-v1'

const VALID_RELIC_NAMES = new Set(
  RELIC_TIERS.flatMap(({ options }) => options.map((option) => option.id)),
)

function getOptionalRegionIds(regionIds: unknown[]) {
  return normalizeLeagueRegionIds(
    regionIds.filter((regionId): regionId is string => typeof regionId === 'string'),
  )
    .filter((regionId) => !GUARANTEED_REGION_IDS.includes(regionId))
    .slice(0, OPTIONAL_REGION_PICK_COUNT)
}

export type PicksState = {
  buildName: string
  selectedBlessings: BlessingSelections
  selectedRegionIds: string[]
  selectedRelics: Record<number, string>
}

export type RegionSelection = {
  color?: string
  id: string
  name: string
}

export function loadPicksState(): PicksState {
  const fallback: PicksState = {
    buildName: '',
    selectedBlessings: {},
    selectedRegionIds: [...GUARANTEED_REGION_IDS],
    selectedRelics: {},
  }

  try {
    const storedValue = window.localStorage.getItem(PICKS_STORAGE_KEY)
    if (!storedValue) return fallback

    const parsed = JSON.parse(storedValue) as Record<string, unknown>
    const selectedRelics: Record<number, string> = {}

    if (
      parsed.selectedRelics &&
      typeof parsed.selectedRelics === 'object' &&
      !Array.isArray(parsed.selectedRelics)
    ) {
      Object.entries(parsed.selectedRelics).forEach(([tierValue, relicValue]) => {
        const tier = Number(tierValue)
        if (
          Number.isInteger(tier) &&
          tier >= 1 &&
          tier <= RELIC_TIERS.length &&
          typeof relicValue === 'string' &&
          VALID_RELIC_NAMES.has(relicValue) &&
          relicValue.startsWith(String(tier))
        ) {
          selectedRelics[tier] = relicValue
        }
      })
    }

    const optionalRegionIds = Array.isArray(parsed.selectedRegionIds)
      ? getOptionalRegionIds(parsed.selectedRegionIds)
      : []

    const selectedBlessings: BlessingSelections = {}
    if (
      parsed.selectedBlessings &&
      typeof parsed.selectedBlessings === 'object' &&
      !Array.isArray(parsed.selectedBlessings)
    ) {
      SELECTABLE_BLESSING_TIERS.forEach((tier) => {
        const blessing = (
          parsed.selectedBlessings as Record<string, unknown>
        )[tier]
        if (isBlessingId(blessing)) selectedBlessings[tier] = blessing
      })
    } else if (isBlessingId(parsed.selectedBlessing)) {
      Object.assign(
        selectedBlessings,
        createLegacyBlessingSelections(parsed.selectedBlessing),
      )
    }

    return {
      buildName:
        typeof parsed.buildName === 'string' ? parsed.buildName.slice(0, 60) : '',
      selectedBlessings,
      selectedRegionIds: [...GUARANTEED_REGION_IDS, ...optionalRegionIds],
      selectedRelics,
    }
  } catch {
    return fallback
  }
}

export function savePicksState(state: PicksState) {
  try {
    window.localStorage.setItem(PICKS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The picker remains usable when storage is unavailable or full.
  }
}

export function createPicksStateFromSharedBuild(build: SharedBuild): PicksState {
  const selectedRelics: Record<number, string> = {}
  build.relics.forEach((relic, index) => {
    const tier = index + 1
    if (VALID_RELIC_NAMES.has(relic) && relic.startsWith(String(tier))) {
      selectedRelics[tier] = relic
    }
  })

  const optionalRegionIds = getOptionalRegionIds(build.regions)

  return {
    buildName: build.buildName.slice(0, 60),
    selectedBlessings: blessingSelectionsFromArray(build.blessings),
    selectedRegionIds: [...GUARANTEED_REGION_IDS, ...optionalRegionIds],
    selectedRelics,
  }
}

export function getInitialRegionSelections(regionIds: string[]): RegionSelection[] {
  const regionById = new Map(
    LEAGUE_OPTIONS.regions.map((region) => [region.id, region]),
  )

  return regionIds.map((id) => {
    const region = regionById.get(id)
    return {
      color: region?.color,
      id,
      name: region?.label ?? id,
    }
  })
}


