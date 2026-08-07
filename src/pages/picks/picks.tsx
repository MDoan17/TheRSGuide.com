import { useCallback, useState } from 'react'
import '@/styles/picker.css'

import { usePersistedPicksState } from '@/hooks/use-persisted-picks-state'
import {
  BLESSING_SELECTION_COUNT,
  GUARANTEED_REGION_IDS,
  OPTIONAL_REGION_PICK_COUNT,
  RELIC_TIERS,
  getRejuvenatedRelicTier,
  isBlessingTreeComplete,
  getInitialRegionSelections,
  type PicksState,
} from '@/lib/picks-state'
import { BlessingSelector } from './components/BlessingSelector'
import { RegionOutlineMap, type RegionSelection } from './components/RegionOutlineMap'
import { RelicSelector } from './components/RelicSelector'
import { ShareBuildDialog } from './components/ShareBuildDialog'
import { ShareSection } from './components/ShareSection'
import { useSharedBuildImport } from './hooks/useSharedBuildImport'

export default function PicksPage() {
  const { picksState, replacePicksState, updatePicksState } =
    usePersistedPicksState()
  const {
    buildName,
    isSpeculativeRelics,
    selectedBlessings,
    selectedRejuvenatedRelic,
    selectedRegionIds,
    selectedRelics,
  } = picksState
  const [selectedRegions, setSelectedRegions] = useState<RegionSelection[]>(() =>
    getInitialRegionSelections(picksState.selectedRegionIds),
  )
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  const importSharedBuild = useCallback((state: PicksState) => {
    replacePicksState(state)
    setSelectedRegions(getInitialRegionSelections(state.selectedRegionIds))
    setIsShareDialogOpen(false)
  }, [replacePicksState])

  useSharedBuildImport(importSharedBuild)

  const selectedRelicCount = Object.keys(selectedRelics).length
  const hasRejuvenatedRelic = Boolean(
    getRejuvenatedRelicTier(selectedRelics, isSpeculativeRelics),
  )
  const selectedOptionalRegionCount = selectedRegionIds.filter(
    (regionId) => !GUARANTEED_REGION_IDS.includes(regionId),
  ).length
  const completedSharePicks =
    selectedRelicCount +
    (selectedRejuvenatedRelic ? 1 : 0) +
    selectedOptionalRegionCount +
    Object.keys(selectedBlessings).length
  const requiredSharePicks =
    RELIC_TIERS.length +
    (hasRejuvenatedRelic ? 1 : 0) +
    OPTIONAL_REGION_PICK_COUNT +
    BLESSING_SELECTION_COUNT
  const isShareReady =
    selectedRelicCount === RELIC_TIERS.length &&
    (!hasRejuvenatedRelic || Boolean(selectedRejuvenatedRelic)) &&
    selectedOptionalRegionCount === OPTIONAL_REGION_PICK_COUNT &&
    isBlessingTreeComplete(selectedBlessings)

  return (
    <div className="leagues-picker">
      <div className="flex flex-col gap-12 py-4 sm:py-6">
        <RelicSelector
          isSpeculative={isSpeculativeRelics}
          onChange={(nextSelectedRelics) =>
            updatePicksState({ selectedRelics: nextSelectedRelics })
          }
          onRejuvenatedRelicChange={(nextSelectedRejuvenatedRelic) =>
            updatePicksState({
              selectedRejuvenatedRelic: nextSelectedRejuvenatedRelic,
            })
          }
          onSpeculativeChange={(nextIsSpeculativeRelics) =>
            updatePicksState({
              isSpeculativeRelics: nextIsSpeculativeRelics,
            })
          }
          selectedRejuvenatedRelic={selectedRejuvenatedRelic}
          selectedRelics={selectedRelics}
        />

        <BlessingSelector
          onChange={(nextSelectedBlessings) =>
            updatePicksState({ selectedBlessings: nextSelectedBlessings })
          }
          selectedBlessings={selectedBlessings}
        />

        <div className="w-full">
          <RegionOutlineMap
            onSelectedRegionIdsChange={(nextSelectedRegionIds) =>
              updatePicksState({ selectedRegionIds: nextSelectedRegionIds })
            }
            onSelectionDetailsChange={setSelectedRegions}
            selectedRegionIds={selectedRegionIds}
          />
        </div>

        <ShareSection
          buildName={buildName}
          completedPicks={completedSharePicks}
          isReady={isShareReady}
          onBuildNameChange={(nextBuildName) =>
            updatePicksState({ buildName: nextBuildName })
          }
          onShare={() => setIsShareDialogOpen(true)}
          requiredPicks={requiredSharePicks}
        />
      </div>

      {isShareDialogOpen && isShareReady && (
        <ShareBuildDialog
          buildName={buildName}
          isSpeculativeRelics={isSpeculativeRelics}
          onClose={() => setIsShareDialogOpen(false)}
          selectedBlessings={selectedBlessings}
          selectedRejuvenatedRelic={selectedRejuvenatedRelic}
          selectedRegions={selectedRegions}
          selectedRelics={selectedRelics}
        />
      )}
    </div>
  )
}
