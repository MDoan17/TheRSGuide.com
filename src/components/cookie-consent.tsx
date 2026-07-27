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
  }
}

type PrivacySettingsContextValue = {
  hasConsent: boolean
  openPreferences: () => void
}

const PrivacySettingsContext = createContext<PrivacySettingsContextValue | null>(null)

function enableRybbit() {
  window.__RYBBIT_OPTOUT__ = false
  if (document.getElementById(RYBBIT_SCRIPT_ID)) return

  const script = document.createElement('script')
  script.id = RYBBIT_SCRIPT_ID
  script.src = 'https://analytics.distortion.me/api/script.js'
  script.async = true
  script.dataset.siteId = 'd8c35c481bf4'
  document.head.append(script)
}

function disableRybbit() {
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

  useEffect(() => {
    if (consent?.analytics) enableRybbit()
    else disableRybbit()
  }, [consent])

  const saveConsent = ({
    analytics,
    functional,
  }: Pick<ConsentPreferences, 'analytics' | 'functional'>) => {
    const wasEnabled = consent?.analytics === true
    const wasFunctional = consent?.functional === true
    const preferences = writeConsent({ analytics, functional })
    setConsent(preferences)
    setDraftAnalytics(analytics)
    setDraftFunctional(functional)
    setPreferencesOpen(false)

    if (!functional) clearFunctionalStorage()

    if ((wasEnabled && !analytics) || (wasFunctional && !functional)) {
      disableRybbit()
      window.location.reload()
    }
  }

  const openPreferences = () => {
    setDraftAnalytics(consent?.analytics ?? false)
    setDraftFunctional(consent?.functional ?? false)
    setPreferencesOpen(true)
  }

  const handlePreferencesOpenChange = (open: boolean) => {
    if (open) {
      setPreferencesOpen(true)
      return
    }

    if (preferencesOpen) {
      saveConsent({ analytics: draftAnalytics, functional: draftFunctional })
    }
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
            onClick={() => saveConsent({ analytics: false, functional: false })}
            aria-label="Close and reject optional storage and analytics"
            title="Continue without optional storage or analytics"
          >
            <XIcon />
          </Button>
          <div className="cookie-banner-copy">
            <h2 id="cookie-banner-title">Your privacy choices</h2>
            <p id="cookie-banner-description">
              Choose whether this guide may remember your progress and preferences or use optional
              analytics. Both stay off unless you allow them.
            </p>
          </div>
          <div className="cookie-banner-actions">
            <Button variant="ghost" size="sm" onClick={openPreferences}>Customize</Button>
            <Button variant="outline" size="sm" onClick={() => saveConsent({ analytics: false, functional: false })}>Reject optional</Button>
            <Button size="sm" onClick={() => saveConsent({ analytics: true, functional: true })}>Accept all</Button>
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
                  can improve the guide. Session recordings are not collected.
                </p>
              </div>
              <Switch
                checked={draftAnalytics}
                onCheckedChange={setDraftAnalytics}
                aria-label="Allow analytics"
              />
            </div>
          </div>

          <DialogFooter className="cookie-preferences-actions">
            <Button variant="outline" onClick={() => saveConsent({ analytics: false, functional: false })}>Reject optional</Button>
            <Button
              variant="secondary"
              onClick={() => saveConsent({ analytics: false, functional: false })}
              aria-label="Accept minimum: allow only the required consent record"
              title="Allow only the required consent record"
            >
              Accept minimum
            </Button>
            <Button onClick={() => saveConsent({ analytics: true, functional: true })}>Accept all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PrivacySettingsContext.Provider>
  )
}
