import { useState } from 'react'
import { RotateCcw } from 'lucide-react'

import {
  RelicDetailView,
  type RelicItem,
} from '@/components/mdx/relic-display'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import relicData from '@/data/leagues-ii/relics.json'
import { RELIC_TIERS } from '@/lib/picks-state'
import { SPECULATIVE_RELIC_TIERS } from '../../../../shared/speculative-relic-options'
import { PickProgressBar } from './PickProgressBar'
import {
  TierOptionMatrix,
  type TierOptionMatrixRow,
} from './TierOptionMatrix'

type RelicSelectorProps = {
  isSpeculative: boolean
  onChange: (relics: Record<number, string>) => void
  onSpeculativeChange: (isSpeculative: boolean) => void
  selectedRelics: Record<number, string>
}

const RELIC_OPTION_ROWS = ['A', 'B', 'C'] as const

const KNOWN_RELICS = new Map<string, RelicItem>(
  relicData.Relics.map((relic) => [relic.name, relic]),
)

export function RelicSelector({
  isSpeculative,
  onChange,
  onSpeculativeChange,
  selectedRelics,
}: RelicSelectorProps) {
  const [selectedRelicDetails, setSelectedRelicDetails] =
    useState<RelicItem | null>(null)
  const selectedCount = Object.keys(selectedRelics).length
  const displayedRelicTiers = isSpeculative
    ? SPECULATIVE_RELIC_TIERS
    : RELIC_TIERS

  const toggleRelic = (tier: number, relicName: string) => {
    const nextSelection = { ...selectedRelics }
    if (nextSelection[tier] === relicName) {
      delete nextSelection[tier]
    } else {
      nextSelection[tier] = relicName
    }
    onChange(nextSelection)
  }

  const matrixTiers = displayedRelicTiers.map((tier) => ({
    isSelected: Boolean(selectedRelics[tier.tier]),
    tier: tier.tier,
  }))
  const matrixRows: TierOptionMatrixRow[] = RELIC_OPTION_ROWS.map(
    (optionLetter, optionIndex) => ({
      id: optionLetter,
      cells: displayedRelicTiers.map((tier) => {
        const option = tier.options[optionIndex]
        if (!option) return null
        const isSelected = selectedRelics[tier.tier] === option.id
        const knownRelic = KNOWN_RELICS.get(option.label)
        return {
          ariaLabel: `Tier ${tier.tier}, option ${optionLetter}, ${option.label}${option.description ? `: ${option.description}` : ''}`,
          description:
            option.description ?? 'Relic description coming soon',
          fallback: optionLetter,
          id: option.id,
          image: option.icon,
          isSelected,
          label: option.label,
          detailsAriaLabel: knownRelic
            ? `View details for ${knownRelic.name}`
            : undefined,
          onSelect: () => toggleRelic(tier.tier, option.id),
          onViewDetails: knownRelic
            ? () => setSelectedRelicDetails(knownRelic)
            : undefined,
        }
      }),
    }),
  )

  return (
    <section className="select-none">
      <div className="mb-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            1. Choose your relics
          </h2>
          <div className="flex items-center gap-4">
            <Label className="cursor-pointer" htmlFor="speculative-relics">
              Speculative mode
              <Switch
                checked={isSpeculative}
                id="speculative-relics"
                onCheckedChange={(checked) => {
                  onChange({})
                  onSpeculativeChange(checked)
                }}
              />
            </Label>
            <button
              aria-label="Reset relic picks"
              className="flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/50 text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
              disabled={selectedCount === 0}
              onClick={() => onChange({})}
              title="Reset relic picks"
              type="button"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
        <PickProgressBar
          className="mt-3"
          label={`${selectedCount} of ${displayedRelicTiers.length} tiers selected`}
          max={displayedRelicTiers.length}
          value={selectedCount}
        />
        {isSpeculative && (
          <p aria-live="polite" className="mt-3 text-xs leading-5 text-muted-foreground">
            Best-guess placements from preview footage. Names, tiers, and slots may change; the confirmed Relics guide is unaffected.
          </p>
        )}
      </div>

      <TierOptionMatrix
        ariaLabel="Relic options by tier"
        className="relic-grid-scroll"
        rows={matrixRows}
        tiers={matrixTiers}
        variant="relic"
      />

      <Drawer
        direction="right"
        open={Boolean(selectedRelicDetails)}
        onOpenChange={(open) => {
          if (!open) setSelectedRelicDetails(null)
        }}
      >
        <DrawerContent>
          {selectedRelicDetails && (
            <RelicDetailView relic={selectedRelicDetails} />
          )}
        </DrawerContent>
      </Drawer>
    </section>
  )
}
