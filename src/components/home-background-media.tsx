import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useSiteSettings } from '@/components/site-settings-context'
import { BackgroundMediaController } from '@/lib/background-media'
import {
  browserBackgroundMediaPreferences,
  vimeoBackgroundMediaAdapter,
} from '@/lib/vimeo-background-media'

const HOME_BACKGROUND_VIDEO_URL = 'https://player.vimeo.com/video/1212838611?background=1&autoplay=1&muted=1&loop=1&autopause=0&dnt=1'

export function HomeBackgroundMedia({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { registerHomeMedia } = useSiteSettings()
  const controller = useMemo(
    () => new BackgroundMediaController(
      vimeoBackgroundMediaAdapter,
      browserBackgroundMediaPreferences,
      10,
    ),
    [],
  )
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  useEffect(() => {
    if (!state.enabled || !iframeRef.current) return
    controller.attach(iframeRef.current)
    return () => controller.detach()
  }, [controller, state.enabled])

  useEffect(() => () => controller.dispose(), [controller])

  const mediaSettings = useMemo(() => ({
    enabled: state.enabled,
    muted: state.muted,
    volume: state.volume,
    setEnabled: controller.setEnabled,
    setMuted: controller.setMuted,
    setVolume: controller.setVolume,
  }), [controller, state.enabled, state.muted, state.volume])

  useEffect(() => {
    registerHomeMedia(mediaSettings)
  }, [mediaSettings, registerHomeMedia])

  useEffect(() => () => registerHomeMedia(null), [registerHomeMedia])

  return (
    <main className="home home-search-page" data-video-enabled={state.enabled}>
      {state.enabled && (
        <>
          <div
            className="home-video-background"
            data-video-playing={state.loaded}
            aria-hidden="true"
          >
            <iframe
              ref={iframeRef}
              id="home-background-video"
              src={HOME_BACKGROUND_VIDEO_URL}
              title="Homepage background video"
              tabIndex={-1}
              allow="autoplay; fullscreen; picture-in-picture"
              loading="eager"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="home-video-poster" aria-hidden="true" />
          </div>
          <div className="home-video-scrim" aria-hidden="true" />
        </>
      )}

      {children}

    </main>
  )
}
