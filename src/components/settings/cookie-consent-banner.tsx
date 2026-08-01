import { XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

function CookieConsentBanner({
  onReject,
  onCustomize,
  onAccept,
}: {
  onReject: () => void
  onCustomize: () => void
  onAccept: () => void
}) {
  return (
    <section
      className="fixed right-4 bottom-4 left-4 z-40 m-auto flex w-[min(76rem,calc(100vw-2rem))] items-center justify-between gap-10 border bg-background/94 py-[1.15rem] pr-12 pl-[1.35rem] shadow-[0_1rem_3rem_rgb(0_0_0_/_28%)] backdrop-blur-[18px] max-[521px]:flex-col max-[521px]:items-stretch max-[521px]:gap-4 max-[521px]:px-4 max-[521px]:pt-5 max-[521px]:pb-4"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
    >
      <Button
        className="absolute top-[.35rem] right-[.35rem] text-muted-foreground"
        variant="ghost"
        size="icon-xs"
        onClick={onReject}
        aria-label="Close and reject optional storage, analytics, and session recording"
        title="Continue without optional storage, analytics, or session recording"
      >
        <XIcon />
      </Button>
      <div className="max-w-[44rem]">
        <h2
          className="mt-0 mb-[.2rem] font-display text-[.9rem] leading-[1.25]"
          id="cookie-banner-title"
        >
          Your privacy choices
        </h2>
        <p
          className="m-0 text-[.72rem] leading-[1.4] text-muted-foreground"
          id="cookie-banner-description"
        >
          Choose whether this guide may remember your progress and preferences
          or use optional analytics and session recording. All stay off unless
          you allow them.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-[.65rem] max-[521px]:grid max-[521px]:grid-cols-2 max-[521px]:[&>button:last-child]:col-span-full">
        <Button variant="ghost" size="sm" onClick={onCustomize}>
          Customize
        </Button>
        <Button variant="outline" size="sm" onClick={onReject}>
          Reject optional
        </Button>
        <Button size="sm" onClick={onAccept}>
          Accept all
        </Button>
      </div>
    </section>
  )
}

export { CookieConsentBanner }
