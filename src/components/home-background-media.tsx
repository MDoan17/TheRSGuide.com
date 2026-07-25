import {
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { BackgroundMediaController } from '@/lib/background-media'
import {
  browserBackgroundMediaPreferences,
  vimeoBackgroundMediaAdapter,
} from '@/lib/vimeo-background-media'

const HOME_BACKGROUND_VIDEO_URL = 'https://player.vimeo.com/video/1212838611?background=1&autoplay=1&muted=1&loop=1&autopause=0&dnt=1'

export function HomeBackgroundMedia({ children }: { children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
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
          </div>
          <div className="home-video-scrim" aria-hidden="true" />
        </>
      )}

      {children}

      <div className="home-media-controls">
        <label className="home-video-control" htmlFor="home-background-video-toggle">
          <span>Background video</span>
          <Switch
            id="home-background-video-toggle"
            checked={state.enabled}
            onCheckedChange={(enabled) => controller.setEnabled(enabled)}
          />
        </label>
        {state.enabled && (
          <div className="home-audio-controls" data-muted={state.muted}>
            {!state.muted && (
              <Slider
                className="home-volume-slider"
                value={[state.volume]}
                min={1}
                max={100}
                step={1}
                onValueChange={([volume]) => controller.setVolume(volume)}
                aria-label="Background video volume"
                aria-valuetext={`${state.volume}%`}
              />
            )}
            <Button
              className="home-audio-control"
              variant="ghost"
              size="icon"
              onClick={() => controller.setMuted(!state.muted)}
              aria-label={state.muted ? 'Unmute background video' : 'Mute background video'}
              title={state.muted ? 'Unmute background video' : 'Mute background video'}
            >
              {state.muted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}
