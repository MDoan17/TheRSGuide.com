export interface BackgroundMediaPlayer {
  ready(): Promise<void>
  play(): Promise<void>
  isPaused(): Promise<boolean>
  setVolume(volume: number): Promise<void>
  onPlayback(listener: () => void): () => void
  dispose(): void
}

export interface BackgroundMediaPlayerAdapter<Target = unknown> {
  create(target: Target): BackgroundMediaPlayer
}

export interface BackgroundMediaPreferenceAdapter {
  loadEnabled(): boolean
  saveEnabled(enabled: boolean): void
}

export type BackgroundMediaState = {
  enabled: boolean
  loaded: boolean
  needsPlaybackGesture: boolean
  muted: boolean
  volume: number
}

type Listener = () => void

const clampVolume = (volume: number) => Math.min(Math.max(Math.round(volume), 0), 100)

export class BackgroundMediaController<Target = unknown> {
  readonly #adapter: BackgroundMediaPlayerAdapter<Target>
  readonly #preferences: BackgroundMediaPreferenceAdapter
  readonly #playbackTimeoutMs: number
  readonly #listeners = new Set<Listener>()

  #state: BackgroundMediaState
  #player: BackgroundMediaPlayer | null = null
  #removePlaybackListener: (() => void) | null = null
  #playbackTimer: ReturnType<typeof setTimeout> | null = null
  #attachmentId = 0

  constructor(
    adapter: BackgroundMediaPlayerAdapter<Target>,
    preferences: BackgroundMediaPreferenceAdapter,
    initialVolume = 10,
    playbackTimeoutMs = 4_000,
  ) {
    this.#adapter = adapter
    this.#preferences = preferences
    this.#playbackTimeoutMs = playbackTimeoutMs
    this.#state = {
      enabled: preferences.loadEnabled(),
      loaded: false,
      needsPlaybackGesture: false,
      muted: true,
      volume: clampVolume(initialVolume),
    }
  }

  getSnapshot = () => this.#state

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  attach = (target: Target) => {
    this.detach()
    if (!this.#state.enabled) return

    const attachmentId = ++this.#attachmentId
    const player = this.#adapter.create(target)
    this.#player = player
    this.#update({ loaded: false, needsPlaybackGesture: false })
    if (this.#playbackTimeoutMs > 0) {
      this.#playbackTimer = setTimeout(() => {
        if (attachmentId === this.#attachmentId && !this.#state.loaded) {
          this.#update({ needsPlaybackGesture: true })
        }
      }, this.#playbackTimeoutMs)
    }

    const reveal = () => {
      if (attachmentId === this.#attachmentId && this.#state.enabled) {
        this.#clearPlaybackTimer()
        this.#update({ loaded: true, needsPlaybackGesture: false })
      }
    }
    this.#removePlaybackListener = player.onPlayback(reveal)

    void player.ready()
      .then(async () => {
        if (attachmentId !== this.#attachmentId) return
        await player.setVolume(this.#state.muted ? 0 : this.#state.volume / 100)
        if (!await player.isPaused()) {
          reveal()
          return
        }
        await player.play()
      })
      .catch(() => {
        if (attachmentId === this.#attachmentId) {
          this.#clearPlaybackTimer()
          this.#update({ loaded: false, needsPlaybackGesture: true })
        }
      })
  }

  detach = () => {
    this.#attachmentId += 1
    this.#clearPlaybackTimer()
    this.#removePlaybackListener?.()
    this.#removePlaybackListener = null
    this.#player?.dispose()
    this.#player = null
  }

  setEnabled = (enabled: boolean) => {
    if (enabled === this.#state.enabled) return
    this.#preferences.saveEnabled(enabled)
    if (!enabled) this.detach()
    this.#update({
      enabled,
      loaded: false,
      needsPlaybackGesture: false,
      ...(enabled ? {} : { muted: true }),
    })
  }

  requestPlayback = async () => {
    const player = this.#player
    const attachmentId = this.#attachmentId
    if (!player || !this.#state.enabled) return

    this.#update({ needsPlaybackGesture: false })
    try {
      await player.play()
      if (attachmentId !== this.#attachmentId) return
      if (!await player.isPaused()) {
        this.#clearPlaybackTimer()
        this.#update({ loaded: true, needsPlaybackGesture: false })
      }
    } catch {
      if (attachmentId === this.#attachmentId) {
        this.#update({ loaded: false, needsPlaybackGesture: true })
      }
    }
  }

  setMuted = (muted: boolean) => {
    if (muted === this.#state.muted) return
    this.#update({ muted })
    void this.#setPlayerVolume(muted ? 0 : this.#state.volume)
  }

  setVolume = (volume: number) => {
    const nextVolume = clampVolume(volume)
    this.#update({ volume: nextVolume, muted: nextVolume === 0 })
    void this.#setPlayerVolume(nextVolume)
  }

  dispose = () => {
    this.detach()
    this.#listeners.clear()
  }

  async #setPlayerVolume(volume: number) {
    try {
      await this.#player?.setVolume(volume / 100)
    } catch {
      // Vimeo can reject commands while an iframe is being replaced.
    }
  }

  #clearPlaybackTimer() {
    if (this.#playbackTimer !== null) {
      clearTimeout(this.#playbackTimer)
      this.#playbackTimer = null
    }
  }

  #update(patch: Partial<BackgroundMediaState>) {
    const next = { ...this.#state, ...patch }
    if (
      next.enabled === this.#state.enabled
      && next.loaded === this.#state.loaded
      && next.needsPlaybackGesture === this.#state.needsPlaybackGesture
      && next.muted === this.#state.muted
      && next.volume === this.#state.volume
    ) return
    this.#state = next
    for (const listener of this.#listeners) listener()
  }
}
