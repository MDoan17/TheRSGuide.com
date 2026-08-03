import { Download, Link2, LoaderCircle } from 'lucide-react'
import { FaDiscord, FaTwitter } from 'react-icons/fa'

import type { ShareStatus } from '../hooks/useShareBuild'

type ShareDialogActionsProps = {
  isMapReady: boolean
  isShareReady: boolean
  onCopyLink: () => void
  onDiscord: () => void
  onDownload: () => void
  onRetry: () => void
  onTwitter: () => void
  shareStatus: ShareStatus
}

const socialActionClass =
  'flex min-h-14 items-center justify-center gap-2 border-r border-border px-4 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent disabled:cursor-wait disabled:text-muted-foreground disabled:hover:bg-transparent'

export function ShareDialogActions({
  isMapReady,
  isShareReady,
  onCopyLink,
  onDiscord,
  onDownload,
  onRetry,
  onTwitter,
  shareStatus,
}: ShareDialogActionsProps) {
  const isPreparing = shareStatus === 'preparing' || shareStatus === 'creating'

  return (
    <footer
      aria-busy={isPreparing}
      className="grid grid-cols-2 border-t border-border sm:grid-cols-4"
    >
      <button
        className={socialActionClass}
        disabled={!isShareReady}
        onClick={onDiscord}
        type="button"
      >
        <FaDiscord aria-hidden className="size-4" /> Discord
      </button>
      <button
        className={socialActionClass}
        disabled={!isShareReady}
        onClick={onTwitter}
        type="button"
      >
        <FaTwitter aria-hidden className="size-4" /> Twitter
      </button>
      <button
        className="flex min-h-14 items-center justify-center gap-2 border-r border-border px-4 text-sm font-semibold text-card-foreground transition-colors hover:bg-accent disabled:cursor-wait disabled:text-muted-foreground"
        disabled={!isMapReady || isPreparing}
        onClick={shareStatus === 'error' ? onRetry : onCopyLink}
        type="button"
      >
        {isPreparing ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Link2 className="size-4" />
        )}
        {!isMapReady || shareStatus === 'preparing'
          ? 'Preparing'
          : shareStatus === 'creating'
            ? 'Creating'
            : shareStatus === 'error'
              ? 'Retry Share'
              : 'Copy Link'}
      </button>
      <button
        className="flex min-h-14 items-center justify-center gap-2 bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground"
        disabled={!isMapReady}
        onClick={onDownload}
        type="button"
      >
        <Download className="size-4" /> Download Image
      </button>
    </footer>
  )
}

