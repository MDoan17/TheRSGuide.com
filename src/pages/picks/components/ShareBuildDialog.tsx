import { useEffect } from 'react'

import { useShareBuild } from '../hooks/useShareBuild'
import type { RegionSelection } from './RegionOutlineMap'
import { ShareDialogActions } from './ShareDialogActions'
import { ShareDialogHeader } from './ShareDialogHeader'
import type { BlessingSelections } from '@/lib/picks-state'

type ShareBuildDialogProps = {
  buildName: string
  onClose: () => void
  selectedBlessings: BlessingSelections
  selectedRejuvenatedRelic: string
  selectedRegions: RegionSelection[]
  selectedRelics: Record<number, string>
}

export function ShareBuildDialog({
  buildName,
  onClose,
  selectedBlessings,
  selectedRejuvenatedRelic,
  selectedRegions,
  selectedRelics,
}: ShareBuildDialogProps) {
  const {
    canvasRef,
    copyLink,
    downloadImage,
    isMapReady,
    retryShare,
    shareError,
    shareStatus,
    shareToDiscord,
    shareToTwitter,
    shareUrl,
  } = useShareBuild({
    buildName,
    selectedBlessings,
    selectedRejuvenatedRelic,
    selectedRegions,
    selectedRelics,
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        aria-labelledby="share-build-title"
        aria-modal="true"
        className="grid max-h-[calc(100svh-1.5rem)] w-full max-w-6xl grid-rows-[auto_1fr_auto] overflow-hidden rounded-md border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <ShareDialogHeader buildName={buildName} onClose={onClose} />

        <div className="min-h-0 overflow-y-auto p-4 sm:p-7">
          <canvas
            aria-label="Preview of your selected relics, regions, and blessing"
            className="block aspect-[1200/630] w-full border border-border bg-[#1a1a1a]"
            ref={canvasRef}
          />
          <div
            aria-live="polite"
            className="min-h-6 pt-2 text-right text-xs text-muted-foreground"
          >
            {shareError && <span className="text-[#e56a6a]">{shareError}</span>}
            {shareUrl && <span className="ml-3">{shareUrl}</span>}
          </div>
        </div>

        <ShareDialogActions
          isMapReady={isMapReady}
          isShareReady={Boolean(shareUrl)}
          onCopyLink={copyLink}
          onDiscord={shareToDiscord}
          onDownload={downloadImage}
          onRetry={retryShare}
          onTwitter={shareToTwitter}
          shareStatus={shareStatus}
        />
      </section>
    </div>
  )
}
