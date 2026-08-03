import { RotateCcw } from 'lucide-react'

import { RELIC_TIERS } from '@/lib/picks-state'
import { PickProgressBar } from './PickProgressBar'
import {
  TierOptionMatrix,
  type TierOptionMatrixRow,
} from './TierOptionMatrix'

type RelicSelectorProps = {
  onChange: (relics: Record<number, string>) => void
  selectedRelics: Record<number, string>
}

const RELIC_OPTION_ROWS = ['A', 'B', 'C'] as const

export function RelicSelector({ onChange, selectedRelics }: RelicSelectorProps) {
  const selectedCount = Object.keys(selectedRelics).length

  const toggleRelic = (tier: number, relicName: string) => {
    const nextSelection = { ...selectedRelics }
    if (nextSelection[tier] === relicName) {
      delete nextSelection[tier]
    } else {
      nextSelection[tier] = relicName
    }
    onChange(nextSelection)
  }

  const matrixTiers = RELIC_TIERS.map((tier) => ({
    isSelected: Boolean(selectedRelics[tier.tier]),
    tier: tier.tier,
  }))
  const matrixRows: TierOptionMatrixRow[] = RELIC_OPTION_ROWS.map(
    (optionLetter, optionIndex) => ({
      id: optionLetter,
      cells: RELIC_TIERS.map((tier) => {
        const option = tier.options[optionIndex]
        if (!option) return null
        const isSelected = selectedRelics[tier.tier] === option.id
        return {
          ariaLabel: `Tier ${tier.tier}, option ${optionLetter}, ${option.label}${option.description ? `: ${option.description}` : ''}`,
          description:
            option.description ?? 'Relic description coming soon',
          fallback: optionLetter,
          id: option.id,
          image: option.icon,
          isSelected,
          label: option.label,
          onSelect: () => toggleRelic(tier.tier, option.id),
        }
      }),
    }),
  )

  return (
    <section className="select-none">
      <div className="mb-1">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-foreground">
            1. Choose your relics
          </h2>
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
        <PickProgressBar
          className="mt-3"
          label={`${selectedCount} of 8 tiers selected`}
          max={8}
          value={selectedCount}
        />
      </div>

      <TierOptionMatrix
        ariaLabel="Relic options by tier"
        className="relic-grid-scroll"
        rows={matrixRows}
        tiers={matrixTiers}
        variant="relic"
      />
    </section>
  )
}
