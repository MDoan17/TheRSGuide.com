import { describe, expect, it } from 'vitest'
import {
  PlayerProfileError,
  playerQuestCompleted,
  playerSkillLevel,
} from './player-profile'
import { normalizeRunemetricsProfile } from './runemetrics-player-adapter'

describe('player profile domain', () => {
  it('normalizes RuneMetrics skills, quests, username, and total level', () => {
    const profile = normalizeRunemetricsProfile({
      name: 'The RS Guy',
      totalskill: '2999',
      skillvalues: [
        { id: 0, level: 99, xp: 13_034_431, rank: 123 },
        { id: 6, level: 120, xp: 200_000_000, rank: 42 },
        { id: 999, level: 1, xp: 0, rank: 0 },
      ],
      quests: [
        { title: 'The World Wakes', status: 'COMPLETED' },
        { name: 'Extinction', status: 'NOT_STARTED' },
      ],
    }, 'requested name')

    expect(profile).toMatchObject({
      username: 'The RS Guy',
      totalLevel: 2999,
      skills: [
        { name: 'Attack', level: 99 },
        { name: 'Magic', level: 120 },
      ],
    })
    expect(playerSkillLevel(profile, 'magic')).toBe(120)
    expect(playerQuestCompleted(profile, 'the world wakes')).toBe(true)
    expect(playerQuestCompleted(profile, 'Extinction')).toBe(false)
    expect(playerQuestCompleted(profile, 'Missing Quest')).toBeNull()
  })

  it('falls back to summed levels when the upstream total is invalid', () => {
    const profile = normalizeRunemetricsProfile({
      totalskill: 'not-a-number',
      skillvalues: [
        { id: 0, level: 10, xp: 1, rank: 1 },
        { id: 1, level: 20, xp: 2, rank: 2 },
      ],
    }, ' Player ')

    expect(profile.username).toBe('Player')
    expect(profile.totalLevel).toBe(30)
  })

  it('turns upstream profile states into stable domain errors', () => {
    expect(() => normalizeRunemetricsProfile({
      error: 'NO_PROFILE',
      skillvalues: [],
    }, 'missing')).toThrowError(
      expect.objectContaining<PlayerProfileError>({
        name: 'PlayerProfileError',
        code: 'not-found',
        message: 'User not found',
      }),
    )
    expect(() => normalizeRunemetricsProfile({
      error: 'PROFILE_PRIVATE',
      skillvalues: [],
    }, 'private')).toThrowError(
      expect.objectContaining<PlayerProfileError>({
        name: 'PlayerProfileError',
        code: 'private',
        message: 'Profile is private',
      }),
    )
  })
})
