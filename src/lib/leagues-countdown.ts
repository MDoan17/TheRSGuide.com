export type LeaguesCountdownPhase = 'starts' | 'ends'

export type LeaguesCountdownTarget = {
  phase: LeaguesCountdownPhase
  targetTimestamp: number
}

export type CountdownUnits = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const parseConfiguredDate = (value: string | undefined) => {
  if (!value?.trim()) return null
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

export const resolveLeaguesCountdown = (
  now: number,
  startDate: string | undefined,
  endDate: string | undefined,
): LeaguesCountdownTarget | null => {
  const startTimestamp = parseConfiguredDate(startDate)
  const endTimestamp = parseConfiguredDate(endDate)

  if (startTimestamp === null) return null
  if (endDate?.trim() && (endTimestamp === null || endTimestamp <= startTimestamp)) return null
  if (now < startTimestamp) return { phase: 'starts', targetTimestamp: startTimestamp }
  if (endTimestamp !== null && now < endTimestamp) {
    return { phase: 'ends', targetTimestamp: endTimestamp }
  }
  return null
}

export const countdownUnits = (remainingMilliseconds: number): CountdownUnits => {
  let remainingSeconds = Math.max(0, Math.ceil(remainingMilliseconds / 1000))
  const days = Math.floor(remainingSeconds / 86_400)
  remainingSeconds %= 86_400
  const hours = Math.floor(remainingSeconds / 3_600)
  remainingSeconds %= 3_600
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return { days, hours, minutes, seconds }
}
