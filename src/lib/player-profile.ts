export interface PlayerSkill {
  name: string
  level: number
  xp: number
  rank: number
}

export interface PlayerQuest {
  id?: string
  title?: string
  name?: string
  status: string
  difficulty?: string
  members?: boolean
  questPoints?: number
  userEligible?: boolean
}

export interface PlayerProfile {
  username: string
  totalLevel: number
  skills: readonly PlayerSkill[]
  quests: readonly PlayerQuest[] | null
}

export interface PlayerProfileAdapter {
  load(username: string, signal: AbortSignal): Promise<PlayerProfile>
}

export type PlayerProfileErrorCode =
  | 'not-found'
  | 'private'
  | 'invalid-response'
  | 'unavailable'

export class PlayerProfileError extends Error {
  readonly code: PlayerProfileErrorCode

  constructor(code: PlayerProfileErrorCode, message: string) {
    super(message)
    this.name = 'PlayerProfileError'
    this.code = code
  }
}

const SKILL_NAME_MAP: Record<string, string> = {
  attack: 'Attack',
  defence: 'Defence',
  strength: 'Strength',
  constitution: 'Constitution',
  ranged: 'Ranged',
  prayer: 'Prayer',
  magic: 'Magic',
  cooking: 'Cooking',
  woodcutting: 'Woodcutting',
  fletching: 'Fletching',
  fishing: 'Fishing',
  firemaking: 'Firemaking',
  crafting: 'Crafting',
  smithing: 'Smithing',
  mining: 'Mining',
  herblore: 'Herblore',
  agility: 'Agility',
  thieving: 'Thieving',
  slayer: 'Slayer',
  farming: 'Farming',
  runecrafting: 'Runecrafting',
  hunter: 'Hunter',
  construction: 'Construction',
  summoning: 'Summoning',
  dungeoneering: 'Dungeoneering',
  divination: 'Divination',
  invention: 'Invention',
  archaeology: 'Archaeology',
  necromancy: 'Necromancy',
}

export const RUNESCAPE_SKILLS = Object.freeze(Object.values(SKILL_NAME_MAP))

const QUEST_TITLE_MAP: Record<string, string> = {
  'once upon a time in gielinor: finale': 'Finale',
  'once upon a time in gielinor: flashback': 'Flashback',
  'once upon a time in gielinor: foreshadowing': 'Foreshadowing',
  'once upon a time in gielinor: fortunes': 'Fortunes',
  'that old black magic: flesh and bone': 'Flesh and Bone',
  'that old black magic: hermy and bass': 'Hermy and Bass',
  'that old black magic: my one and only lute': 'My One and Only Lute',
  'that old black magic: skelly by everlight': 'Skelly By Everlight',
  'helping laniakea (miniquest)': 'Helping Laniakea',
}

export const normalizeUsername = (username: string) => username.trim()

export const playerSkillLevel = (profile: PlayerProfile | null, skillName: string): number | null => {
  if (!profile) return null
  const normalizedName = SKILL_NAME_MAP[skillName.toLowerCase()] ?? skillName
  return profile.skills.find((skill) =>
    skill.name.toLowerCase() === normalizedName.toLowerCase()
  )?.level ?? null
}

export const playerQuestCompleted = (
  profile: PlayerProfile | null,
  questName: string,
): boolean | null => {
  if (!profile?.quests) return null
  const normalizedName = QUEST_TITLE_MAP[questName.toLowerCase()] ?? questName
  const quest = profile.quests.find((candidate) => {
    const name = candidate.title || candidate.name
    return name?.toLowerCase() === normalizedName.toLowerCase()
  })
  return quest ? quest.status === 'Completed' : null
}
