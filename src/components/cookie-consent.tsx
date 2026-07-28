import {
  type FormEvent,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  SettingsIcon,
  ShieldCheckIcon,
  VideoIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  SiteSettingsContext,
  type HomeMediaSettings,
  type SettingsPage,
  useSiteSettings,
} from '@/components/site-settings-context'
import { cn } from '@/lib/utils'
import {
  clearFunctionalStorage,
  readConsent,
  writeConsent,
  type ConsentPreferences,
} from '@/lib/privacy-preferences'

const RYBBIT_SCRIPT_ID = 'rybbit-analytics'
const MAX_FEEDBACK_LENGTH = 1500

declare global {
  interface Window {
    __RYBBIT_OPTOUT__?: boolean
    rybbit?: {
      stopSessionReplay?: () => void
    }
  }
}

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

export function SiteSettingsButton({
  className,
  label = 'Open settings',
}: {
  className?: string
  label?: string
}) {
  const settings = useSiteSettings()

  return (
    <Button
      className={cn('site-settings-trigger', className)}
      variant="ghost"
      size="icon"
      onClick={() => settings.openSettings()}
      aria-label={label}
      title={label}
    >
      <SettingsIcon />
    </Button>
  )
}

function SettingsBackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      className="settings-back"
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      aria-label="Back to settings"
      title="Back to settings"
    >
      <ArrowLeftIcon />
    </Button>
  )
}

function SettingsDialogHeader({
  title,
  onBack,
}: {
  title: string
  onBack?: () => void
}) {
  return (
    <DialogHeader
      className={cn(
        'settings-dialog-header',
        onBack && 'settings-dialog-header-with-back',
      )}
    >
      {onBack && <SettingsBackButton onClick={onBack} />}
      <DialogTitle>{title}</DialogTitle>
      <DialogClose asChild>
        <Button
          className="settings-dialog-close"
          variant="ghost"
          size="icon-sm"
          aria-label="Close settings"
          title="Close settings"
        >
          <XIcon />
        </Button>
      </DialogClose>
    </DialogHeader>
  )
}

export function CookieConsent({ children }: PropsWithChildren) {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => readConsent())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsPage, setSettingsPage] = useState<SettingsPage>('main')
  const [homeMedia, setHomeMedia] = useState<HomeMediaSettings | null>(null)
  const [draftAnalytics, setDraftAnalytics] = useState(() => consent?.analytics ?? false)
  const [draftFunctional, setDraftFunctional] = useState(() => consent?.functional ?? false)
  const [draftSessionReplay, setDraftSessionReplay] = useState(
    () => consent?.sessionReplay ?? false,
  )
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<{
    type: 'error' | 'success'
    message: string
  } | null>(null)
  const [feedbackSending, setFeedbackSending] = useState(false)

  useEffect(() => {
    if (consent?.analytics) enableRybbit(consent.sessionReplay)
    else disableRybbit()
  }, [consent])

  const saveConsent = ({
    analytics,
    functional,
    sessionReplay,
  }: Pick<ConsentPreferences, 'analytics' | 'functional' | 'sessionReplay'>, close = true) => {
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
    if (close) setSettingsOpen(false)

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

  const resetPrivacyDraft = useCallback(() => {
    setDraftAnalytics(consent?.analytics ?? false)
    setDraftFunctional(consent?.functional ?? false)
    setDraftSessionReplay(consent?.sessionReplay ?? false)
  }, [consent])

  const openSettings = useCallback((page: SettingsPage = 'main') => {
    if (page === 'privacy') resetPrivacyDraft()
    setSettingsPage(page)
    setFeedbackStatus(null)
    setSettingsOpen(true)
  }, [resetPrivacyDraft])

  const registerHomeMedia = useCallback((settings: HomeMediaSettings | null) => {
    setHomeMedia(settings)
  }, [])

  const contextValue = useMemo(() => ({
    openSettings,
    registerHomeMedia,
  }), [openSettings, registerHomeMedia])

  const savePrivacyDraft = (close = true) => {
    saveConsent({
      analytics: draftAnalytics,
      functional: draftFunctional,
      sessionReplay: draftSessionReplay,
    }, close)
  }

  const backToSettings = () => {
    if (settingsPage === 'privacy') savePrivacyDraft(false)
    setSettingsPage('main')
    setFeedbackStatus(null)
  }

  const handleSettingsOpenChange = (open: boolean) => {
    if (open) {
      setSettingsOpen(true)
      return
    }

    if (settingsPage === 'privacy') savePrivacyDraft()
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

  const sendFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = feedbackMessage.trim()
    if (!message || feedbackSending) return

    setFeedbackSending(true)
    setFeedbackStatus(null)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          page: window.location.pathname,
        }),
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) throw new Error(payload?.error || 'Unable to send this message right now')

      setFeedbackMessage('')
      setFeedbackStatus({
        type: 'success',
        message: 'Thanks! Your message was sent.',
      })
    } catch (error) {
      setFeedbackStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to send this message right now',
      })
    } finally {
      setFeedbackSending(false)
    }
  }

  return (
    <SiteSettingsContext.Provider value={contextValue}>
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
            <Button variant="ghost" size="sm" onClick={() => openSettings('privacy')}>
              Customize
            </Button>
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

      <Dialog open={settingsOpen} onOpenChange={handleSettingsOpenChange}>
        <DialogContent className="site-settings-dialog" showCloseButton={false}>
          {settingsPage === 'main' && (
            <>
              <SettingsDialogHeader title="Settings" />

              <ScrollArea className="site-settings-scroll">
                <div className="site-settings-body">
                  {homeMedia && (
                    <section className="settings-section" aria-labelledby="homepage-media-title">
                      <div className="settings-section-heading">
                        <VideoIcon aria-hidden="true" />
                        <h3 id="homepage-media-title">Homepage background</h3>
                      </div>
                      <div className="settings-control-list">
                        <label className="settings-control" htmlFor="settings-background-video">
                          <strong>Background video</strong>
                          <Switch
                            id="settings-background-video"
                            checked={homeMedia.enabled}
                            onCheckedChange={homeMedia.setEnabled}
                          />
                        </label>
                        <div
                          className="settings-audio-control"
                          data-muted={homeMedia.muted || undefined}
                          data-disabled={!homeMedia.enabled || undefined}
                        >
                          <Button
                            className="settings-audio-toggle"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => homeMedia.setMuted(!homeMedia.muted)}
                            disabled={!homeMedia.enabled}
                            aria-label={homeMedia.muted
                              ? 'Unmute background video'
                              : 'Mute background video'}
                            aria-pressed={homeMedia.muted}
                            title={homeMedia.muted
                              ? 'Unmute background video'
                              : 'Mute background video'}
                          >
                            {homeMedia.muted
                              ? <VolumeXIcon />
                              : <Volume2Icon />}
                          </Button>
                          <span className="settings-audio-label">Volume</span>
                          <Slider
                            className="settings-volume-slider"
                            value={[homeMedia.volume]}
                            min={1}
                            max={100}
                            step={1}
                            disabled={!homeMedia.enabled || homeMedia.muted}
                            onValueChange={([volume]) => homeMedia.setVolume(volume)}
                            aria-label="Background video volume"
                            aria-valuetext={`${homeMedia.volume}%`}
                          />
                          <output>{homeMedia.volume}%</output>
                        </div>
                      </div>
                    </section>
                  )}

                  <nav className="settings-menu" aria-label="More settings">
                    <Button
                      className="settings-menu-item"
                      variant="ghost"
                      onClick={() => {
                        resetPrivacyDraft()
                        setSettingsPage('privacy')
                      }}
                    >
                      <ShieldCheckIcon data-icon="inline-start" />
                      <strong>Privacy settings</strong>
                      <ChevronRightIcon data-icon="inline-end" />
                    </Button>
                    <Button
                      className="settings-menu-item"
                      variant="ghost"
                      onClick={() => setSettingsPage('feedback')}
                    >
                      <MessageSquareIcon data-icon="inline-start" />
                      <strong>Send us a message</strong>
                      <ChevronRightIcon data-icon="inline-end" />
                    </Button>
                  </nav>
                </div>
              </ScrollArea>
            </>
          )}

          {settingsPage === 'privacy' && (
            <>
              <SettingsDialogHeader title="Privacy settings" onBack={backToSettings} />

              <ScrollArea className="site-settings-scroll">
                <div className="settings-subpage-body">
                  <DialogDescription>
                    Choose what this guide may remember and whether optional analytics may run.
                    Changes save when you go back or close this dialog.
                  </DialogDescription>
                  <div className="cookie-preference-list">
                    <div className="cookie-preference">
                      <div>
                        <strong>Required consent record</strong>
                        <p>
                          Stores this privacy choice for 180 days so the banner does not reappear
                          on every page. It is not used for analytics or advertising.
                        </p>
                      </div>
                      <Switch checked disabled aria-label="The consent record is always enabled" />
                    </div>
                    <div className="cookie-preference">
                      <div>
                        <strong>Remember progress and preferences</strong>
                        <p>
                          Remembers your last player search, manually checked progression, activity
                          and efficiency checklists, color theme, sidebar state, and background-video
                          choice. When disabled, those features still work for the current visit but
                          are not saved.
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
                          Rybbit measures visits, navigation, device types, and general usage
                          patterns so we can improve the guide. This does not enable session
                          recording.
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
                          Rybbit records clicks, scrolling, navigation, and page interactions so we
                          can find usability problems. Form input values are masked by the recorder.
                          This requires analytics and remains off unless you enable it.
                        </p>
                      </div>
                      <Switch
                        checked={draftSessionReplay}
                        onCheckedChange={setSessionReplayPreference}
                        aria-label="Allow session recording"
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

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
            </>
          )}

          {settingsPage === 'feedback' && (
            <>
              <SettingsDialogHeader title="Send us a message" onBack={backToSettings} />

              <form className="settings-feedback-form" onSubmit={sendFeedback}>
                <DialogDescription>
                  Found an error or have an idea? Send it directly to the guide team.
                </DialogDescription>
                <FieldGroup>
                  <Field data-invalid={feedbackStatus?.type === 'error'}>
                    <FieldLabel htmlFor="settings-feedback-message">Message</FieldLabel>
                    <Textarea
                      id="settings-feedback-message"
                      value={feedbackMessage}
                      onChange={(event) => {
                        setFeedbackMessage(event.target.value)
                        setFeedbackStatus(null)
                      }}
                      placeholder="Tell us what could be clearer, what is missing, or what went wrong."
                      maxLength={MAX_FEEDBACK_LENGTH}
                      rows={7}
                      disabled={feedbackSending}
                      aria-invalid={feedbackStatus?.type === 'error'}
                    />
                    <FieldDescription>
                      {feedbackMessage.length}/{MAX_FEEDBACK_LENGTH} characters. Please do not
                      include passwords or other private information.
                    </FieldDescription>
                    {feedbackStatus?.type === 'error' && (
                      <FieldError>{feedbackStatus.message}</FieldError>
                    )}
                    {feedbackStatus?.type === 'success' && (
                      <p className="settings-feedback-success" role="status">
                        {feedbackStatus.message}
                      </p>
                    )}
                  </Field>
                </FieldGroup>
                <Button
                  type="submit"
                  disabled={!feedbackMessage.trim() || feedbackSending}
                >
                  <MessageSquareIcon data-icon="inline-start" />
                  {feedbackSending ? 'Sending…' : 'Send message'}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </SiteSettingsContext.Provider>
  )
}
