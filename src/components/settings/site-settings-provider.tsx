import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

import { CookieConsentBanner } from "@/components/settings/cookie-consent-banner"
import { FeedbackSettings } from "@/components/settings/feedback-settings"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { SettingsDialogHeader } from "@/components/settings/settings-dialog-header"
import { SettingsMain } from "@/components/settings/settings-main"
import {
  SiteSettingsContext,
  type HomeMediaSettings,
  type SettingsPage,
} from "@/components/settings/site-settings-context"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  disableAnalytics,
  enableAnalytics,
} from "@/lib/analytics"
import {
  clearFunctionalStorage,
  readConsent,
  writeConsent,
  type ConsentPreferences,
} from "@/lib/privacy-preferences"

const REJECTED_PREFERENCES = {
  analytics: false,
  functional: false,
  sessionReplay: false,
} as const

const ACCEPTED_PREFERENCES = {
  analytics: true,
  functional: true,
  sessionReplay: true,
} as const

function SiteSettingsProvider({ children }: PropsWithChildren) {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() =>
    readConsent()
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsPage, setSettingsPage] = useState<SettingsPage>("main")
  const [homeMedia, setHomeMedia] = useState<HomeMediaSettings | null>(null)
  const [draftAnalytics, setDraftAnalytics] = useState(
    () => consent?.analytics ?? false
  )
  const [draftFunctional, setDraftFunctional] = useState(
    () => consent?.functional ?? false
  )
  const [draftSessionReplay, setDraftSessionReplay] = useState(
    () => consent?.sessionReplay ?? false
  )

  useEffect(() => {
    if (consent?.analytics) enableAnalytics(consent.sessionReplay)
    else disableAnalytics()
  }, [consent])

  const saveConsent = useCallback(
    (
      {
        analytics,
        functional,
        sessionReplay,
      }: Pick<
        ConsentPreferences,
        "analytics" | "functional" | "sessionReplay"
      >,
      close = true
    ) => {
      const normalizedReplay = analytics && sessionReplay
      const wasAnalyticsEnabled = consent?.analytics === true
      const wasFunctional = consent?.functional === true
      const replayChanged =
        consent !== null && consent.sessionReplay !== normalizedReplay
      const preferences = writeConsent({
        analytics,
        functional,
        sessionReplay: normalizedReplay,
      })
      setConsent(preferences)
      setDraftAnalytics(analytics)
      setDraftFunctional(functional)
      setDraftSessionReplay(normalizedReplay)
      if (close) setSettingsOpen(false)

      if (!functional) clearFunctionalStorage()

      if (
        (wasAnalyticsEnabled && !analytics) ||
        (wasFunctional && !functional) ||
        replayChanged
      ) {
        disableAnalytics()
        window.location.reload()
      }
    },
    [consent]
  )

  const resetPrivacyDraft = useCallback(() => {
    setDraftAnalytics(consent?.analytics ?? false)
    setDraftFunctional(consent?.functional ?? false)
    setDraftSessionReplay(consent?.sessionReplay ?? false)
  }, [consent])

  const openSettings = useCallback(
    (page: SettingsPage = "main") => {
      if (page === "privacy") resetPrivacyDraft()
      setSettingsPage(page)
      setSettingsOpen(true)
    },
    [resetPrivacyDraft]
  )

  const registerHomeMedia = useCallback(
    (settings: HomeMediaSettings | null) => {
      setHomeMedia(settings)
    },
    []
  )

  const contextValue = useMemo(
    () => ({
      openSettings,
      registerHomeMedia,
    }),
    [openSettings, registerHomeMedia]
  )

  const savePrivacyDraft = useCallback(
    (close = true) => {
      saveConsent(
        {
          analytics: draftAnalytics,
          functional: draftFunctional,
          sessionReplay: draftSessionReplay,
        },
        close
      )
    },
    [draftAnalytics, draftFunctional, draftSessionReplay, saveConsent]
  )

  const backToSettings = () => {
    if (settingsPage === "privacy") savePrivacyDraft(false)
    setSettingsPage("main")
  }

  const handleSettingsOpenChange = (open: boolean) => {
    if (open) {
      setSettingsOpen(true)
      return
    }

    if (settingsPage === "privacy") savePrivacyDraft()
    else setSettingsOpen(false)
  }

  const setAnalyticsPreference = (enabled: boolean) => {
    setDraftAnalytics(enabled)
    if (!enabled) setDraftSessionReplay(false)
  }

  const setSessionReplayPreference = (enabled: boolean) => {
    setDraftSessionReplay(enabled)
    if (enabled) setDraftAnalytics(true)
  }

  const rejectOptional = () => saveConsent(REJECTED_PREFERENCES)
  const acceptAll = () => saveConsent(ACCEPTED_PREFERENCES)

  return (
    <SiteSettingsContext.Provider value={contextValue}>
      {children}
      {!consent && (
        <CookieConsentBanner
          onReject={rejectOptional}
          onCustomize={() => openSettings("privacy")}
          onAccept={acceptAll}
        />
      )}
      <Dialog open={settingsOpen} onOpenChange={handleSettingsOpenChange}>
        <DialogContent
          className="grid h-[min(42rem,calc(100svh-2rem))] max-h-[calc(100svh-2rem)] w-[min(38rem,calc(100vw-2rem))]! max-w-none! grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-(--radius) p-0 sm:max-w-none! [&_[data-slot=dialog-description]]:text-[.78rem] [&_[data-slot=dialog-description]]:leading-[1.5] [&_[data-slot=dialog-footer]]:m-0 [&_[data-slot=dialog-footer]]:rounded-none max-[768px]:h-[calc(100svh-1.25rem)] max-[768px]:max-h-[calc(100svh-1.25rem)] max-[768px]:w-[calc(100vw-1.25rem)]!"
          showCloseButton={false}
        >
          {settingsPage === "main" && (
            <>
              <SettingsDialogHeader title="Settings" />
              <SettingsMain
                homeMedia={homeMedia}
                onOpenPrivacy={() => {
                  resetPrivacyDraft()
                  setSettingsPage("privacy")
                }}
                onOpenFeedback={() => setSettingsPage("feedback")}
              />
            </>
          )}
          {settingsPage === "privacy" && (
            <PrivacySettings
              functional={draftFunctional}
              analytics={draftAnalytics}
              sessionReplay={draftSessionReplay}
              onFunctionalChange={setDraftFunctional}
              onAnalyticsChange={setAnalyticsPreference}
              onSessionReplayChange={setSessionReplayPreference}
              onBack={backToSettings}
              onReject={rejectOptional}
              onAcceptMinimum={rejectOptional}
              onAcceptAll={acceptAll}
            />
          )}
          {settingsPage === "feedback" && (
            <FeedbackSettings onBack={backToSettings} />
          )}
        </DialogContent>
      </Dialog>
    </SiteSettingsContext.Provider>
  )
}

export { SiteSettingsProvider }
export { SiteSettingsButton } from "@/components/settings/site-settings-button"
