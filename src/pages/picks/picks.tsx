import { useCallback, useEffect, useState } from 'react'
import '@/styles/picker.css'

import {
  BLESSING_SELECTION_COUNT,
  GUARANTEED_REGION_IDS,
  OPTIONAL_REGION_PICK_COUNT,
  RELIC_TIERS,
  isBlessingTreeComplete,
  getInitialRegionSelections,
  loadPicksState,
  savePicksState,
  type BlessingSelections,
  type PicksState,
} from '@/lib/picks-state'
import { BlessingSelector } from './components/BlessingSelector'
import { RegionOutlineMap, type RegionSelection } from './components/RegionOutlineMap'
import { RelicSelector } from './components/RelicSelector'
import { ShareBuildDialog } from './components/ShareBuildDialog'
import { ShareSection } from './components/ShareSection'
import { useSharedBuildImport } from './hooks/useSharedBuildImport'

export default function PicksPage() {
  const [initialPicksState] = useState(loadPicksState)
  const [buildName, setBuildName] = useState(initialPicksState.buildName)
  const [selectedBlessings, setSelectedBlessings] = useState<BlessingSelections>(
    initialPicksState.selectedBlessings,
  )
  const [selectedRelics, setSelectedRelics] = useState<Record<number, string>>(
    initialPicksState.selectedRelics,
  )
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(
    initialPicksState.selectedRegionIds,
  )
  const [selectedRegions, setSelectedRegions] = useState<RegionSelection[]>(() =>
    getInitialRegionSelections(initialPicksState.selectedRegionIds),
  )
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)

  const importSharedBuild = useCallback((state: PicksState) => {
    setBuildName(state.buildName)
    setSelectedBlessings(state.selectedBlessings)
    setSelectedRelics(state.selectedRelics)
    setSelectedRegionIds(state.selectedRegionIds)
    setSelectedRegions(getInitialRegionSelections(state.selectedRegionIds))
    setIsShareDialogOpen(false)
  }, [])

  useSharedBuildImport(importSharedBuild)

  const selectedRelicCount = Object.keys(selectedRelics).length
  const selectedOptionalRegionCount = selectedRegionIds.filter(
    (regionId) => !GUARANTEED_REGION_IDS.includes(regionId),
  ).length
  const completedSharePicks =
    selectedRelicCount +
    selectedOptionalRegionCount +
    Object.keys(selectedBlessings).length
  const requiredSharePicks =
    RELIC_TIERS.length +
    OPTIONAL_REGION_PICK_COUNT +
    BLESSING_SELECTION_COUNT
  const isShareReady =
    selectedRelicCount === RELIC_TIERS.length &&
    selectedOptionalRegionCount === OPTIONAL_REGION_PICK_COUNT &&
    isBlessingTreeComplete(selectedBlessings)

  useEffect(() => {
    savePicksState({
      buildName,
      selectedBlessings,
      selectedRegionIds,
      selectedRelics,
    })
  }, [buildName, selectedBlessings, selectedRegionIds, selectedRelics])

  return (
    <div className="leagues-picker">
      <div className="flex flex-col gap-12 py-4 sm:py-6">
        <RelicSelector
          onChange={setSelectedRelics}
          selectedRelics={selectedRelics}
        />

        <BlessingSelector
          onChange={setSelectedBlessings}
          selectedBlessings={selectedBlessings}
        />

        <div className="w-full">
          <RegionOutlineMap
            onSelectedRegionIdsChange={setSelectedRegionIds}
            onSelectionDetailsChange={setSelectedRegions}
            selectedRegionIds={selectedRegionIds}
          />
        </div>

        <ShareSection
          buildName={buildName}
          completedPicks={completedSharePicks}
          isReady={isShareReady}
          onBuildNameChange={setBuildName}
          onShare={() => setIsShareDialogOpen(true)}
          requiredPicks={requiredSharePicks}
        />
      </div>

      {isShareDialogOpen && isShareReady && (
        <ShareBuildDialog
          buildName={buildName}
          onClose={() => setIsShareDialogOpen(false)}
          selectedBlessings={selectedBlessings}
          selectedRegions={selectedRegions}
          selectedRelics={selectedRelics}
        />
      )}
    </div>
  )
}
