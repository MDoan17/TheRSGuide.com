import {
  PlayerProfileError,
  normalizeUsername,
  type PlayerProfile,
  type PlayerProfileAdapter,
  type PlayerQuest,
  type PlayerSkill,
} from '@/lib/player-profile'

interface RunemetricsSkillValue {
  id?: unknown
  level?: unknown
  xp?: unknown
  rank?: unknown
}

interface RunemetricsProfilePayload {
  name?: unknown
  totalskill?: unknown
  skillvalues?: unknown
  quests?: unknown
  error?: unknown
}

const SKILL_ID_MAP: Record<number, string> = {
  0: 'Attack',
  1: 'Defence',
  2: 'Strength',
  3: 'Constitution',
  4: 'Ranged',
  5: 'Prayer',
  6: 'Magic',
  7: 'Cooking',
  8: 'Woodcutting',
  9: 'Fletching',
  10: 'Fishing',
  11: 'Firemaking',
  12: 'Crafting',
  13: 'Smithing',
  14: 'Mining',
  15: 'Herblore',
  16: 'Agility',
  17: 'Thieving',
  18: 'Slayer',
  19: 'Farming',
  20: 'Runecrafting',
  21: 'Hunter',
  22: 'Construction',
  23: 'Summoning',
  24: 'Dungeoneering',
  25: 'Divination',
  26: 'Invention',
  27: 'Archaeology',
  28: 'Necromancy',
}

const normalizeQuestStatus = (status: string) =>
  status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())

const numberValue = (value: unknown, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const mapSkill = (value: RunemetricsSkillValue): PlayerSkill | null => {
  const id = numberValue(value.id, -1)
  const name = SKILL_ID_MAP[id]
  if (!name) return null
  return {
    name,
    level: numberValue(value.level),
    xp: numberValue(value.xp),
    rank: numberValue(value.rank),
  }
}

const mapQuest = (value: unknown): PlayerQuest | null => {
  if (!value || typeof value !== 'object') return null
  const quest = value as Record<string, unknown>
  const status = typeof quest.status === 'string' ? normalizeQuestStatus(quest.status) : 'Not Started'
  return {
    ...(typeof quest.id === 'string' ? { id: quest.id } : {}),
    ...(typeof quest.title === 'string' ? { title: quest.title } : {}),
    ...(typeof quest.name === 'string' ? { name: quest.name } : {}),
    status,
    ...(typeof quest.difficulty === 'string' ? { difficulty: quest.difficulty } : {}),
    ...(typeof quest.members === 'boolean' ? { members: quest.members } : {}),
    ...(typeof quest.questPoints === 'number' ? { questPoints: quest.questPoints } : {}),
    ...(typeof quest.userEligible === 'boolean' ? { userEligible: quest.userEligible } : {}),
  }
}

export const normalizeRunemetricsProfile = (
  payload: RunemetricsProfilePayload,
  requestedUsername: string,
): PlayerProfile => {
  if (payload.error === 'NO_PROFILE') {
    throw new PlayerProfileError('not-found', 'User not found')
  }
  if (payload.error === 'PROFILE_PRIVATE') {
    throw new PlayerProfileError('private', 'Profile is private')
  }
  if (!Array.isArray(payload.skillvalues)) {
    throw new PlayerProfileError('invalid-response', 'Failed to fetch player data')
  }

  const username = typeof payload.name === 'string' && payload.name.trim()
    ? payload.name.trim()
    : normalizeUsername(requestedUsername)
  const skills = payload.skillvalues
    .map((value) => mapSkill(value as RunemetricsSkillValue))
    .filter((skill): skill is PlayerSkill => skill !== null)
  const apiTotalLevel = Number(payload.totalskill)
  const totalLevel = Number.isFinite(apiTotalLevel)
    ? apiTotalLevel
    : skills.reduce((total, skill) => total + skill.level, 0)
  const quests = Array.isArray(payload.quests)
    ? payload.quests.map(mapQuest).filter((quest): quest is PlayerQuest => quest !== null)
    : null

  return { username, totalLevel, skills, quests }
}

export const runemetricsPlayerAdapter: PlayerProfileAdapter = {
  async load(username, signal) {
    const normalizedUsername = normalizeUsername(username)
    const response = await fetch(`/api/player/${encodeURIComponent(normalizedUsername)}`, { signal })
    const payload = await response.json().catch(() => ({})) as RunemetricsProfilePayload

    if (!response.ok) {
      if (response.status === 404 || payload.error === 'NO_PROFILE') {
        throw new PlayerProfileError('not-found', 'User not found')
      }
      if (response.status === 403 || payload.error === 'PROFILE_PRIVATE') {
        throw new PlayerProfileError('private', 'Profile is private')
      }
      const message = typeof payload.error === 'string'
        && !['NO_PROFILE', 'PROFILE_PRIVATE'].includes(payload.error)
        ? payload.error
        : 'Failed to fetch player data'
      throw new PlayerProfileError('unavailable', message)
    }

    return normalizeRunemetricsProfile(payload, normalizedUsername)
  },
}
