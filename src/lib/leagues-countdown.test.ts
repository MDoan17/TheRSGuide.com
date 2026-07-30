import { describe, expect, it } from 'vitest'
import { countdownUnits, resolveLeaguesCountdown } from './leagues-countdown'

const start = '2026-08-10T12:00:00Z'
const end = '2026-09-10T12:00:00Z'

describe('Leagues countdown', () => {
  it('targets the configured start before the League begins', () => {
    expect(resolveLeaguesCountdown(Date.parse('2026-08-01T12:00:00Z'), start, end)).toEqual({
      phase: 'starts',
      targetTimestamp: Date.parse(start),
    })
  })

  it('targets the configured end while the League is active', () => {
    expect(resolveLeaguesCountdown(Date.parse(start), start, end)).toEqual({
      phase: 'ends',
      targetTimestamp: Date.parse(end),
    })
  })

  it('returns no countdown at or after the configured end', () => {
    expect(resolveLeaguesCountdown(Date.parse(end), start, end)).toBeNull()
    expect(resolveLeaguesCountdown(Date.parse('2026-09-11T12:00:00Z'), start, end)).toBeNull()
  })

  it('uses a valid start without an end only before the League begins', () => {
    expect(resolveLeaguesCountdown(Date.parse('2026-08-01T12:00:00Z'), start, undefined)?.phase)
      .toBe('starts')
    expect(resolveLeaguesCountdown(Date.parse(start), start, undefined)).toBeNull()
  })

  it('fails safely for missing, invalid, or reversed configurations', () => {
    expect(resolveLeaguesCountdown(Date.now(), undefined, end)).toBeNull()
    expect(resolveLeaguesCountdown(Date.now(), 'not-a-date', end)).toBeNull()
    expect(resolveLeaguesCountdown(Date.now(), start, 'not-a-date')).toBeNull()
    expect(resolveLeaguesCountdown(Date.now(), end, start)).toBeNull()
  })

  it('breaks the remaining duration into stable display units', () => {
    const remaining = (((1 * 24 + 2) * 60 + 3) * 60 + 4) * 1000
    expect(countdownUnits(remaining)).toEqual({
      days: 1,
      hours: 2,
      minutes: 3,
      seconds: 4,
    })
    expect(countdownUnits(-1)).toEqual({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    })
  })
})
