import { X } from 'lucide-react'

import { DEFAULT_BUILD_NAME } from '../../../../shared/share-contract'

type ShareDialogHeaderProps = {
  buildName: string
  onClose: () => void
}

export function ShareDialogHeader({
  buildName,
  onClose,
}: ShareDialogHeaderProps) {
  return (
    <header className="grid h-16 grid-cols-[1fr_4rem] border-b border-border">
      <div className="flex min-w-0 flex-col justify-center px-5 sm:px-7">
        <h2
          className="font-display text-lg font-semibold text-card-foreground"
          id="share-build-title"
        >
          {buildName.trim() || DEFAULT_BUILD_NAME}
        </h2>
      </div>
      <button
        aria-label="Close share preview"
        className="flex size-16 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        onClick={onClose}
        type="button"
      >
        <X className="size-6" />
      </button>
    </header>
  )
}

