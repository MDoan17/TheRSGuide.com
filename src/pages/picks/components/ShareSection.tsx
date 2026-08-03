import { Share2 } from 'lucide-react'

import { PickProgressBar } from './PickProgressBar'

type ShareSectionProps = {
  buildName: string
  completedPicks: number
  isReady: boolean
  onBuildNameChange: (name: string) => void
  onShare: () => void
  requiredPicks: number
}

export function ShareSection({
  buildName,
  completedPicks,
  isReady,
  onBuildNameChange,
  onShare,
  requiredPicks,
}: ShareSectionProps) {
  return (
    <section className="mx-auto w-full max-w-xl">
      {isReady ? (
        <>
          <div className="mb-3 flex items-end justify-between gap-4">
            <label
              className="text-sm font-semibold text-foreground"
              htmlFor="build-name"
            >
              Name your build
            </label>
            <span className="text-xs text-muted-foreground">
              Optional
            </span>
          </div>
          <input
            className="min-h-14 w-full rounded-md border border-input bg-background px-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20"
            id="build-name"
            maxLength={60}
            onChange={(event) => onBuildNameChange(event.target.value)}
            type="text"
            value={buildName}
          />
        </>
      ) : (
        <div className="flex min-h-[5.75rem] items-end pb-3">
          <p
            className="text-sm font-semibold text-muted-foreground"
            id="share-picks-requirement"
          >
            Finish your picks before sharing
          </p>
        </div>
      )}
      <PickProgressBar
        label={`${completedPicks} of ${requiredPicks} required picks complete`}
        max={requiredPicks}
        value={completedPicks}
      />
      <button
        aria-describedby={!isReady ? 'share-picks-requirement' : undefined}
        className="group mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-md bg-primary px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:text-lg"
        disabled={!isReady}
        onClick={onShare}
        type="button"
      >
        <Share2 className="size-6 transition-transform group-hover:-translate-y-0.5 group-disabled:translate-y-0" />
        Share your picks
      </button>
    </section>
  )
}
