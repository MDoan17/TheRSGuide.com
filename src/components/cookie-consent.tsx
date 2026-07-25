import { useEffect, useState } from 'react'
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

const CONSENT_COOKIE = 'rs-guide-consent'
const CONSENT_VERSION = 1
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180
const RYBBIT_SCRIPT_ID = 'rybbit-analytics'

type ConsentPreferences = {
  version: number
  analytics: boolean
  updatedAt: string
}

declare global {
  interface Window {
    __RYBBIT_OPTOUT__?: boolean
  }
}

function readConsent(): ConsentPreferences | null {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${CONSENT_COOKIE}=`))

  if (!cookie) return null

  try {
    const parsed = JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))) as ConsentPreferences
    return parsed.version === CONSENT_VERSION && typeof parsed.analytics === 'boolean'
      ? parsed
      : null
  } catch {
    return null
  }
}

function writeConsent(analytics: boolean): ConsentPreferences {
  const preferences = {
    version: CONSENT_VERSION,
    analytics,
    updatedAt: new Date().toISOString(),
  }
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(preferences))}; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`
  return preferences
}

function enableRybbit() {
  window.__RYBBIT_OPTOUT__ = false
  window.localStorage.removeItem('disable-rybbit')
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
  window.localStorage.setItem('disable-rybbit', 'true')
}

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => readConsent())
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [draftAnalytics, setDraftAnalytics] = useState(() => consent?.analytics ?? false)

  useEffect(() => {
    if (consent?.analytics) enableRybbit()
    else disableRybbit()
  }, [consent])

  const saveConsent = (analytics: boolean) => {
    const wasEnabled = consent?.analytics === true
    const preferences = writeConsent(analytics)
    setConsent(preferences)
    setDraftAnalytics(analytics)
    setPreferencesOpen(false)

    if (wasEnabled && !analytics) {
      disableRybbit()
      window.location.reload()
    }
  }

  const openPreferences = () => {
    setDraftAnalytics(consent?.analytics ?? false)
    setPreferencesOpen(true)
  }

  return (
    <>
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
            onClick={() => saveConsent(false)}
            aria-label="Close and continue without optional analytics"
            title="Continue without optional analytics"
          >
            <XIcon />
          </Button>
          <div className="cookie-banner-copy">
            <h2 id="cookie-banner-title">Your privacy choices</h2>
            <p id="cookie-banner-description">
              We use optional analytics to understand how the guide is used and where it can be
              improved. Tracking stays off unless you allow it.
            </p>
          </div>
          <div className="cookie-banner-actions">
            <Button variant="ghost" size="sm" onClick={openPreferences}>Customize</Button>
            <Button variant="outline" size="sm" onClick={() => saveConsent(false)}>Reject optional</Button>
            <Button size="sm" onClick={() => saveConsent(true)}>Accept all</Button>
          </div>
        </section>
      )}

      {consent && (
        <Button
          className="cookie-settings-trigger"
          variant="ghost"
          size="sm"
          onClick={openPreferences}
        >
          Privacy settings
        </Button>
      )}

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="cookie-preferences-dialog">
          <DialogHeader>
            <DialogTitle>Privacy settings</DialogTitle>
            <DialogDescription>
              Choose whether optional analytics may run. You can return here and change this choice
              at any time.
            </DialogDescription>
          </DialogHeader>

          <div className="cookie-preference-list">
            <div className="cookie-preference">
              <div>
                <strong>Essential cookies</strong>
                <p>Remember privacy choices and settings required for the guide to function.</p>
              </div>
              <Switch checked disabled aria-label="Essential cookies are always enabled" />
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
            <Button variant="outline" onClick={() => saveConsent(false)}>Reject optional</Button>
            <Button variant="secondary" onClick={() => saveConsent(draftAnalytics)}>Save choices</Button>
            <Button onClick={() => saveConsent(true)}>Accept all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
