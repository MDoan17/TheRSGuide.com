import { describe, expect, it, vi } from 'vitest'
import {
  BackgroundMediaController,
  type BackgroundMediaPlayer,
  type BackgroundMediaPlayerAdapter,
  type BackgroundMediaPreferenceAdapter,
} from './background-media'

const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const createHarness = (enabled = true, playbackTimeoutMs = 0) => {
  const players: Array<{
    playback: () => void
    ready: ReturnType<typeof deferred<void>>
    paused: boolean
    play: ReturnType<typeof vi.fn<() => Promise<void>>>
    volumes: number[]
    disposed: boolean
  }> = []
  const savedPreferences: boolean[] = []
  const adapter: BackgroundMediaPlayerAdapter<string> = {
    create() {
      const record = {
        playback: (() => undefined) as () => void,
        ready: deferred<void>(),
        paused: true,
        play: vi.fn(async () => undefined),
        volumes: [] as number[],
        disposed: false,
      }
      players.push(record)
      const player: BackgroundMediaPlayer = {
        ready: () => record.ready.promise,
        play: record.play,
        isPaused: async () => record.paused,
        setVolume: async (volume) => { record.volumes.push(volume) },
        onPlayback: (listener) => {
          record.playback = listener
          return () => { record.playback = () => undefined }
        },
        dispose: () => { record.disposed = true },
      }
      return player
    },
  }
  const preferences: BackgroundMediaPreferenceAdapter = {
    loadEnabled: () => enabled,
    saveEnabled: (value) => { savedPreferences.push(value) },
  }
  return {
    controller: new BackgroundMediaController(
      adapter,
      preferences,
      10,
      playbackTimeoutMs,
    ),
    players,
    savedPreferences,
  }
}

describe('BackgroundMediaController', () => {
  it('starts from the saved preference with muted ten-percent volume', () => {
    const { controller } = createHarness(false)

    expect(controller.getSnapshot()).toEqual({
      enabled: false,
      loaded: false,
      needsPlaybackGesture: false,
      muted: true,
      volume: 10,
    })
  })

  it('reveals media on playback and initializes the player muted', async () => {
    const { controller, players } = createHarness()
    controller.attach('iframe')
    const player = players[0]

    player.ready.resolve()
    await vi.waitFor(() => expect(player.volumes).toEqual([0]))
    expect(controller.getSnapshot().loaded).toBe(false)

    player.playback()
    expect(controller.getSnapshot().loaded).toBe(true)
  })

  it('reveals ready media that is already playing', async () => {
    const { controller, players } = createHarness()
    controller.attach('iframe')
    players[0].paused = false
    players[0].ready.resolve()

    await vi.waitFor(() => expect(controller.getSnapshot().loaded).toBe(true))
  })

  it('requests autoplay when ready media is paused', async () => {
    const { controller, players } = createHarness()
    controller.attach('iframe')
    players[0].ready.resolve()

    await vi.waitFor(() => expect(players[0].play).toHaveBeenCalledOnce())
  })

  it('offers a playback gesture when autoplay is rejected', async () => {
    const { controller, players } = createHarness()
    controller.attach('iframe')
    players[0].play.mockRejectedValueOnce(new Error('Autoplay blocked'))
    players[0].ready.resolve()

    await vi.waitFor(() => {
      expect(controller.getSnapshot().needsPlaybackGesture).toBe(true)
    })
  })

  it('offers a playback gesture when startup stalls', async () => {
    const { controller } = createHarness(true, 10)
    controller.attach('iframe')

    await vi.waitFor(() => {
      expect(controller.getSnapshot().needsPlaybackGesture).toBe(true)
    })
  })

  it('recovers through a user-requested playback', async () => {
    const { controller, players } = createHarness()
    controller.attach('iframe')
    players[0].play.mockRejectedValueOnce(new Error('Autoplay blocked'))
    players[0].ready.resolve()
    await vi.waitFor(() => {
      expect(controller.getSnapshot().needsPlaybackGesture).toBe(true)
    })

    players[0].paused = false
    await controller.requestPlayback()

    expect(players[0].play).toHaveBeenCalledTimes(2)
    expect(controller.getSnapshot()).toMatchObject({
      loaded: true,
      needsPlaybackGesture: false,
    })
  })

  it('ignores playback events from a replaced attachment', () => {
    const { controller, players } = createHarness()
    controller.attach('first')
    const stalePlayback = players[0].playback
    controller.attach('second')

    expect(players[0].disposed).toBe(true)
    stalePlayback()
    expect(controller.getSnapshot().loaded).toBe(false)

    players[1].playback()
    expect(controller.getSnapshot().loaded).toBe(true)
  })

  it('sends normalized volume and treats zero as muted', async () => {
    const { controller, players } = createHarness()
    controller.attach('iframe')

    controller.setMuted(false)
    await vi.waitFor(() => expect(players[0].volumes).toContain(0.1))

    controller.setVolume(42)
    await vi.waitFor(() => expect(players[0].volumes).toContain(0.42))
    expect(controller.getSnapshot()).toMatchObject({ muted: false, volume: 42 })

    controller.setVolume(0)
    await vi.waitFor(() => expect(players[0].volumes.at(-1)).toBe(0))
    expect(controller.getSnapshot()).toMatchObject({ muted: true, volume: 0 })
  })

  it('persists disabling and tears down the current player', () => {
    const { controller, players, savedPreferences } = createHarness()
    controller.attach('iframe')
    players[0].playback()

    controller.setEnabled(false)

    expect(savedPreferences).toEqual([false])
    expect(players[0].disposed).toBe(true)
    expect(controller.getSnapshot()).toMatchObject({
      enabled: false,
      loaded: false,
      muted: true,
    })
  })
})
