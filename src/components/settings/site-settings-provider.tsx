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
import { readPrivacyRegion } from "@/lib/privacy-region"

const REJECTED_PREFERENCES = {
  analytics: false,
  functional: false,
} as const

const ACCEPTED_PREFERENCES = {
  analytics: true,
  functional: true,
} as const

function SiteSettingsProvider({ children }: PropsWithChildren) {
  const privacyRegion = useMemo(() => readPrivacyRegion(), [])
  const defaults = privacyRegion === "standard"
    ? ACCEPTED_PREFERENCES
    : REJECTED_PREFERENCES
  const [consent, setConsent] = useState<ConsentPreferences | null>(() =>
    readConsent()
  )
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsPage, setSettingsPage] = useState<SettingsPage>("main")
  const [homeMedia, setHomeMedia] = useState<HomeMediaSettings | null>(null)
  const [draftAnalytics, setDraftAnalytics] = useState(
    () => consent?.analytics ?? defaults.analytics
  )
  const [draftFunctional, setDraftFunctional] = useState(
    () => consent?.functional ?? defaults.functional
  )
  const analyticsEnabled = consent?.analytics ?? defaults.analytics

  useEffect(() => {
    if (analyticsEnabled) enableAnalytics()
    else disableAnalytics({
      forget: consent?.analytics === false,
      persist: consent?.analytics === false,
    })
  }, [analyticsEnabled, consent?.analytics])

  const saveConsent = useCallback(
    (
      {
        analytics,
        functional,
      }: Pick<ConsentPreferences, "analytics" | "functional">,
      close = true
    ) => {
      const wasAnalyticsEnabled = consent?.analytics ?? defaults.analytics
      const wasFunctional = consent?.functional ?? defaults.functional
      const preferences = writeConsent({
        analytics,
        functional,
      })
      setConsent(preferences)
      setDraftAnalytics(analytics)
      setDraftFunctional(functional)
      if (close) setSettingsOpen(false)

      if (!functional) clearFunctionalStorage()

      if (
        (wasAnalyticsEnabled && !analytics) ||
        wasFunctional !== functional
      ) {
        if (!analytics) disableAnalytics({ forget: true, persist: true })
        window.location.reload()
      }
    },
    [consent, defaults]
  )

  const resetPrivacyDraft = useCallback(() => {
    setDraftAnalytics(consent?.analytics ?? defaults.analytics)
    setDraftFunctional(consent?.functional ?? defaults.functional)
  }, [consent, defaults])

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
        },
        close
      )
    },
    [draftAnalytics, draftFunctional, saveConsent]
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

  const rejectOptional = () => saveConsent(REJECTED_PREFERENCES)
  const acceptAll = () => saveConsent(ACCEPTED_PREFERENCES)

  return (
    <SiteSettingsContext.Provider value={contextValue}>
      {children}
      {privacyRegion === "strict" && !consent && !settingsOpen && (
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
              strictRegion={privacyRegion === "strict"}
              onFunctionalChange={setDraftFunctional}
              onAnalyticsChange={setDraftAnalytics}
              onBack={backToSettings}
              onReject={rejectOptional}
              onSave={savePrivacyDraft}
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
