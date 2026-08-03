import { RotateCcw } from 'lucide-react'

import { OPTIONAL_REGION_PICK_COUNT } from '@/lib/picks-state'
import { PickProgressBar } from './PickProgressBar'

type RegionPickerHeaderProps = {
  canReset: boolean
  onReset: () => void
  selectedCount: number
}

export function RegionPickerHeader({
  canReset,
  onReset,
  selectedCount,
}: RegionPickerHeaderProps) {
  return (
    <div className="mb-1">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold text-foreground">
          3. Choose your regions
        </h2>
        <button
          aria-label="Reset region picks"
          className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-primary/50 text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
          disabled={!canReset}
          onClick={onReset}
          title="Reset region picks"
          type="button"
        >
          <RotateCcw className="size-3.5" />
        </button>
      </div>
      <PickProgressBar
        className="mt-3"
        label={`${selectedCount} of ${OPTIONAL_REGION_PICK_COUNT} optional regions selected`}
        max={OPTIONAL_REGION_PICK_COUNT}
        value={selectedCount}
      />
    </div>
  )
}
