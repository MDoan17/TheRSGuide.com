import { createContext, type PropsWithChildren, useContext, useEffect, useState } from 'react'
import { XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import {
  clearFunctionalStorage,
  readConsent,
  writeConsent,
  type ConsentPreferences,
} from '@/lib/privacy-preferences'

const RYBBIT_SCRIPT_ID = 'rybbit-analytics'

declare global {
  interface Window {
    __RYBBIT_OPTOUT__?: boolean
    rybbit?: {
      stopSessionReplay?: () => void
    }
  }
}

type PrivacySettingsContextValue = {
  hasConsent: boolean
  openPreferences: () => void
}

const PrivacySettingsContext = createContext<PrivacySettingsContextValue | null>(null)

function enableRybbit(sessionReplay: boolean) {
  window.__RYBBIT_OPTOUT__ = false
  if (document.getElementById(RYBBIT_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = RYBBIT_SCRIPT_ID
  script.src = 'https://analytics.distortion.me/api/script.js'
  script.async = true
  script.dataset.siteId = 'd8c35c481bf4'
  // Rybbit checks the replay sample rate before loading its recorder. A rate of
  // zero guarantees that replay never initializes for visitors who declined it.
  script.dataset.replaySampleRate = sessionReplay ? '100' : '0'
  script.dataset.replayMaskAllInputs = 'true'
  script.dataset.replayCollectFonts = 'false'
  script.dataset.replayMaskTextSelectors = JSON.stringify([
    '.player-profile-header h1',
    '.home-player-result strong',
  ])
  document.head.append(script)
}

function disableRybbit() {
  window.rybbit?.stopSessionReplay?.()
  window.__RYBBIT_OPTOUT__ = true
}

export function PrivacySettingsButton({ className }: { className?: string }) {
  const privacySettings = useContext(PrivacySettingsContext)

  if (!privacySettings?.hasConsent) return null

  return (
    <Button
      className={cn('cookie-settings-trigger', className)}
      variant="ghost"
      size="sm"
      onClick={privacySettings.openPreferences}
    >
      Privacy settings
    </Button>
  )
}

export function CookieConsent({ children }: PropsWithChildren) {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => readConsent())
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [draftAnalytics, setDraftAnalytics] = useState(() => consent?.analytics ?? false)
  const [draftFunctional, setDraftFunctional] = useState(() => consent?.functional ?? false)
  const [draftSessionReplay, setDraftSessionReplay] = useState(
    () => consent?.sessionReplay ?? false,
  )

  useEffect(() => {
    if (consent?.analytics) enableRybbit(consent.sessionReplay)
    else disableRybbit()
  }, [consent])

  const saveConsent = ({
    analytics,
    functional,
    sessionReplay,
  }: Pick<ConsentPreferences, 'analytics' | 'functional' | 'sessionReplay'>) => {
    const normalizedReplay = analytics && sessionReplay
    const wasAnalyticsEnabled = consent?.analytics === true
    const wasFunctional = consent?.functional === true
    const replayChanged = consent !== null && consent.sessionReplay !== normalizedReplay
    const preferences = writeConsent({
      analytics,
      functional,
      sessionReplay: normalizedReplay,
    })
    setConsent(preferences)
    setDraftAnalytics(analytics)
    setDraftFunctional(functional)
    setDraftSessionReplay(normalizedReplay)
    setPreferencesOpen(false)

    if (!functional) clearFunctionalStorage()

    if (
      (wasAnalyticsEnabled && !analytics)
      || (wasFunctional && !functional)
      || replayChanged
    ) {
      disableRybbit()
      window.location.reload()
    }
  }

  const openPreferences = () => {
    setDraftAnalytics(consent?.analytics ?? false)
    setDraftFunctional(consent?.functional ?? false)
    setDraftSessionReplay(consent?.sessionReplay ?? false)
    setPreferencesOpen(true)
  }

  const handlePreferencesOpenChange = (open: boolean) => {
    if (open) {
      setPreferencesOpen(true)
      return
    }

    if (preferencesOpen) {
      saveConsent({
        analytics: draftAnalytics,
        functional: draftFunctional,
        sessionReplay: draftSessionReplay,
      })
    }
  }

  const setAnalyticsPreference = (enabled: boolean) => {
    setDraftAnalytics(enabled)
    if (!enabled) setDraftSessionReplay(false)
  }

  const setSessionReplayPreference = (enabled: boolean) => {
    setDraftSessionReplay(enabled)
    if (enabled) setDraftAnalytics(true)
  }

  return (
    <PrivacySettingsContext.Provider
      value={{ hasConsent: Boolean(consent), openPreferences }}
    >
      {children}

      {!consent && (
        <section
          className="cookie-banner"
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
        >
          <Button
            className="cookie-banner-close"
            variant="ghost"
            size="icon-xs"
            onClick={() => saveConsent({
              analytics: false,
              functional: false,
              sessionReplay: false,
            })}
            aria-label="Close and reject optional storage, analytics, and session recording"
            title="Continue without optional storage, analytics, or session recording"
          >
            <XIcon />
          </Button>
          <div className="cookie-banner-copy">
            <h2 id="cookie-banner-title">Your privacy choices</h2>
            <p id="cookie-banner-description">
              Choose whether this guide may remember your progress and preferences or use optional
              analytics and session recording. All stay off unless you allow them.
            </p>
          </div>
          <div className="cookie-banner-actions">
            <Button variant="ghost" size="sm" onClick={openPreferences}>Customize</Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveConsent({
                analytics: false,
                functional: false,
                sessionReplay: false,
              })}
            >
              Reject optional
            </Button>
            <Button
              size="sm"
              onClick={() => saveConsent({
                analytics: true,
                functional: true,
                sessionReplay: true,
              })}
            >
              Accept all
            </Button>
          </div>
        </section>
      )}

      <Dialog open={preferencesOpen} onOpenChange={handlePreferencesOpenChange}>
        <DialogContent className="cookie-preferences-dialog">
          <DialogHeader>
            <DialogTitle>Privacy settings</DialogTitle>
            <DialogDescription>
              Choose what this guide may remember and whether optional analytics may run. You can
              return here and change these choices at any time. Switch changes save when you close
              this dialog.
            </DialogDescription>
          </DialogHeader>

          <div className="cookie-preference-list">
            <div className="cookie-preference">
              <div>
                <strong>Required consent record</strong>
                <p>
                  Stores this privacy choice for 180 days so the banner does not reappear on every
                  page. It is not used for analytics or advertising.
                </p>
              </div>
              <Switch checked disabled aria-label="The consent record is always enabled" />
            </div>
            <div className="cookie-preference">
              <div>
                <strong>Remember progress and preferences</strong>
                <p>
                  Remembers your last player search, manually checked progression, activity and
                  efficiency checklists, color theme, sidebar state, and background-video choice.
                  When disabled, those features still work for the current visit but are not saved.
                </p>
              </div>
              <Switch
                checked={draftFunctional}
                onCheckedChange={setDraftFunctional}
                aria-label="Remember guide progress and preferences"
              />
            </div>
            <div className="cookie-preference">
              <div>
                <strong>Analytics</strong>
                <p>
                  Rybbit measures visits, navigation, device types, and general usage patterns so we
                  can improve the guide. This does not enable session recording.
                </p>
              </div>
              <Switch
                checked={draftAnalytics}
                onCheckedChange={setAnalyticsPreference}
                aria-label="Allow analytics"
              />
            </div>
            <div className="cookie-preference">
              <div>
                <strong>Session recording</strong>
                <p>
                  Rybbit records clicks, scrolling, navigation, and page interactions so we can find
                  usability problems. Form input values are masked by the recorder. This requires
                  analytics and remains off unless you enable it.
                </p>
              </div>
              <Switch
                checked={draftSessionReplay}
                onCheckedChange={setSessionReplayPreference}
                aria-label="Allow session recording"
              />
            </div>
          </div>

          <DialogFooter className="cookie-preferences-actions">
            <Button
              variant="outline"
              onClick={() => saveConsent({
                analytics: false,
                functional: false,
                sessionReplay: false,
              })}
            >
              Reject optional
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveConsent({
                analytics: false,
                functional: false,
                sessionReplay: false,
              })}
              aria-label="Accept minimum: allow only the required consent record"
              title="Allow only the required consent record"
            >
              Accept minimum
            </Button>
            <Button
              onClick={() => saveConsent({
                analytics: true,
                functional: true,
                sessionReplay: true,
              })}
            >
              Accept all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivacySettingsContext.Provider>
  )
}
