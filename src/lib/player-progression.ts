import {
  playerQuestCompleted,
  playerSkillLevel,
  type PlayerProfile,
} from '@/lib/player-profile'
import { findQuest, resolveAllRequirements } from '@/utils/quest-requirements'

export type ProgressionStage = 'early' | 'mid' | 'late'
export type ProgressionStatus = 'completed' | 'ready' | 'locked'

export interface SkillRequirement {
  skill: string
  level: number
}

interface RecommendationRequirements {
  skills?: SkillRequirement[]
  anySkills?: SkillRequirement[]
  quests?: string[]
  manual?: string[]
}

export interface ProgressionRecommendation {
  stage: ProgressionStage
  title: string
  description: string
  path: string
  completionQuest?: string
  requirements?: RecommendationRequirements
}

export interface EvaluatedRecommendation extends ProgressionRecommendation {
  status: ProgressionStatus
  missing: string[]
  manualChecks: string[]
  requirementCount: number
}

const early: ProgressionRecommendation[] = [
  { stage: 'early', title: 'Desert Treasure', description: 'Unlock the Ancient Magicks spellbook.', path: '/guides/early-game/desert-treasure', completionQuest: 'Desert Treasure' },
  { stage: 'early', title: 'Devotion Ability', description: 'Unlock Devotion, Sacrifice, and Transfigure.', path: '/guides/early-game/devotion-ability', requirements: { quests: ['One Piercing Note'], manual: ['Unlock the abilities through Anima Islands or God Wars Dungeon drops'] } },
  { stage: 'early', title: 'The Dig Site', description: 'Unlock the Tendrils abilities.', path: '/guides/early-game/dig-site', completionQuest: 'The Dig Site' },
  { stage: 'early', title: "Evil Dave's Big Day Out", description: 'Earn early XP and unlock spicy stew skill boosts.', path: '/guides/early-game/evil-daves-big-day-out', completionQuest: "Evil Dave's Big Day Out" },
  { stage: 'early', title: 'Giant Oyster', description: 'Unlock monthly Fishing, Farming, and clue rewards.', path: '/guides/early-game/giant-oyster', completionQuest: 'Beneath Cursed Tides' },
  { stage: 'early', title: 'Haunted Mine', description: 'Unlock the Salve Amulet.', path: '/guides/early-game/haunted-mine', completionQuest: 'Haunted Mine' },
  { stage: 'early', title: 'Lunar Diplomacy', description: 'Unlock the Lunar spellbook.', path: '/guides/early-game/lunar-diplomacy', completionQuest: 'Lunar Diplomacy' },
  { stage: 'early', title: 'Penguin Quest Series', description: 'Unlock the weekly Penguin Hide and Seek rewards.', path: '/guides/early-game/penguin-quest-series', completionQuest: 'Back to the Freezer' },
  { stage: 'early', title: 'Royal Trouble', description: 'Improve passive resource gathering in Miscellania.', path: '/guides/early-game/royal-trouble', completionQuest: 'Royal Trouble' },
  { stage: 'early', title: 'Succession', description: 'Unlock the Dive ability.', path: '/guides/early-game/succession', completionQuest: 'Succession' },
  { stage: 'early', title: 'The World Wakes', description: "Unlock Sunshine and Death's Swiftness.", path: '/guides/early-game/the-world-wakes', completionQuest: 'The World Wakes' },
]

const mid: ProgressionRecommendation[] = [
  { stage: 'mid', title: 'Ancient Curses', description: 'Unlock the Ancient Curses prayer book.', path: '/guides/mid-game/ancient-curses', completionQuest: 'The Temple at Senntisten' },
  { stage: 'mid', title: 'City of Senntisten', description: 'Unlock Ancient Magicks combat spells.', path: '/guides/mid-game/city-of-senntisten', completionQuest: 'City of Senntisten' },
  { stage: 'mid', title: 'Chaotic and Ruinous Weapons', description: 'Open an efficient path to tier 80 and tier 90 weapons.', path: '/guides/mid-game/chaotic-and-ruinous-weapons', requirements: { skills: [{ skill: 'Dungeoneering', level: 70 }], manual: ['90 Dungeoneering for Ruinous weapons (95 for Ironmen)'] } },
  { stage: 'mid', title: 'Disruption Shield', description: 'Unlock a powerful Lunar spellbook defensive.', path: '/guides/mid-game/disruption-shield', requirements: { quests: ['Lunar Diplomacy'], manual: ['Earn 90,000 Produce Points at Livid Farm'] } },
  { stage: 'mid', title: 'Double Surge', description: 'Gain a major mobility upgrade from Anachronia Agility.', path: '/guides/mid-game/double-surge', requirements: { skills: [{ skill: 'Agility', level: 85 }], manual: ['Collect 500 codex pages on the Anachronia Agility course'] } },
  { stage: 'mid', title: 'Dungeoneering Passive Unlocks', description: 'Collect useful combat and skilling conveniences.', path: '/guides/mid-game/dungeoneering-passive-unlocks', requirements: { skills: [{ skill: 'Dungeoneering', level: 70 }] } },
  { stage: 'mid', title: 'The Gate of Elidinis', description: 'Unlock the skilling boss and its rewards.', path: '/guides/mid-game/gate-of-elidinis', completionQuest: 'Ode of the Devourer' },
  { stage: 'mid', title: 'Invention', description: 'Unlock the elite skill and powerful equipment perks.', path: '/guides/mid-game/invention', requirements: { skills: [{ skill: 'Smithing', level: 80 }, { skill: 'Crafting', level: 80 }, { skill: 'Divination', level: 80 }] } },
  { stage: 'mid', title: 'Player Owned Ports', description: 'Start long-running, time-gated voyages early.', path: '/guides/mid-game/ports', requirements: { anySkills: [{ skill: 'Hunter', level: 90 }, { skill: 'Thieving', level: 90 }, { skill: 'Divination', level: 90 }] } },
  { stage: 'mid', title: 'Prifddinas', description: 'Unlock the elven city hub.', path: '/guides/mid-game/prifddinas', completionQuest: "Plague's End" },
  { stage: 'mid', title: "Shadow's Grace", description: 'Halve the cooldown of key movement abilities.', path: '/guides/mid-game/shadows-grace', requirements: { skills: [{ skill: 'Archaeology', level: 67 }], manual: ['Complete the Secrets of the Inquisition mystery'] } },
  { stage: 'mid', title: 'Slayer Helmet', description: 'Gain damage and accuracy bonuses while on Slayer tasks.', path: '/guides/mid-game/slayer-helmet', requirements: { skills: [{ skill: 'Slayer', level: 87 }, { skill: 'Crafting', level: 25 }], quests: ['Stolen Hearts', 'Diamond in the Rough', "Gertrude's Cat", "Icthlarin's Little Helper", 'The Restless Ghost', 'Smoking Kills'], manual: ['Collect the required helmet components'] } },
  { stage: 'mid', title: 'Smoking Kills', description: 'Unlock full Slayer point rewards.', path: '/guides/mid-game/smoking-kills', completionQuest: 'Smoking Kills' },
  { stage: 'mid', title: 'Vault of Hereditas', description: 'Unlock high-level Thieving and tier 90 rewards.', path: '/guides/mid-game/vault-of-hereditas', requirements: { skills: [{ skill: 'Thieving', level: 95 }, { skill: 'Agility', level: 72 }], manual: ['Complete A Guild of Our Own miniquest'] } },
  { stage: 'mid', title: 'While Guthix Sleeps', description: 'Unlock the Dragon Forge, XP lamps, and Tormented Demons.', path: '/guides/mid-game/while-guthix-sleeps', completionQuest: 'While Guthix Sleeps' },
]

const late: ProgressionRecommendation[] = [
  { stage: 'late', title: 'Alpha vs Omega', description: 'Unlock the Rasial boss encounter.', path: '/guides/late-game/alpha-vs-omega', completionQuest: 'Alpha vs Omega' },
  { stage: 'late', title: 'Eclipse of the Heart', description: 'Unlock the Amascut boss encounter.', path: '/guides/late-game/eclipse-of-the-heart', completionQuest: 'Eclipse of the Heart' },
  { stage: 'late', title: 'Extinction', description: 'Unlock the Ring of Vigour passive and endgame content.', path: '/guides/late-game/extinction', completionQuest: 'Extinction' },
  { stage: 'late', title: 'Overloads', description: 'Create the essential potions for endgame PvM.', path: '/guides/late-game/overloads', requirements: { skills: [{ skill: 'Herblore', level: 96 }] } },
  { stage: 'late', title: "Sliske's Endgame", description: 'Complete the capstone of the Sliske quest line.', path: '/guides/late-game/sliskes-endgame', completionQuest: "Sliske's Endgame" },
  { stage: 'late', title: "War's Blessing Tier 4", description: 'Unlock powerful Combat Achievement rewards.', path: '/guides/late-game/wars-blessing-t4', requirements: { manual: ['Reach 1,401 total Combat Mastery score'] } },
  { stage: 'late', title: 'Zuk Cape', description: 'Earn best-in-slot capes from TzKal-Zuk.', path: '/guides/late-game/zuk-cape', requirements: { quests: ['The Elder Kiln'], manual: ['Defeat TzKal-Zuk for the relevant igneous stone'] } },
]

export const progressionRecommendations = [...early, ...mid, ...late]

function resolvedRequirements(recommendation: ProgressionRecommendation) {
  if (recommendation.requirements) {
    const { quests = [], skills = [], manual = [], anySkills = [] } = recommendation.requirements
    const resolved = resolveAllRequirements(quests, skills, manual)
    return { ...resolved, anySkills }
  }

  if (recommendation.completionQuest) {
    const quest = findQuest(recommendation.completionQuest)
    if (quest) {
      const resolved = resolveAllRequirements(
        quest.requirements.quest,
        quest.requirements.skill,
        quest.requirements.other ?? [],
      )
      return { ...resolved, anySkills: [] as SkillRequirement[] }
    }
  }

  return { skills: [] as SkillRequirement[], quests: [] as string[], other: [] as string[], anySkills: [] as SkillRequirement[] }
}

export function evaluateRecommendation(
  recommendation: ProgressionRecommendation,
  player: PlayerProfile,
  manuallyCompleted: ReadonlySet<string> = new Set(),
): EvaluatedRecommendation {
  const requirements = resolvedRequirements(recommendation)
  const missingSkills = requirements.skills
    .filter(({ skill, level }) => (playerSkillLevel(player, skill) ?? 0) < level)
    .map(({ skill, level }) => `${level} ${skill}`)
  const missingQuests = requirements.quests
    .filter((quest) => playerQuestCompleted(player, quest) !== true)
    .map((quest) => quest)
  const anySkillMet = !requirements.anySkills.length
    || requirements.anySkills.some(({ skill, level }) => (playerSkillLevel(player, skill) ?? 0) >= level)
  const missingAnySkill = anySkillMet
    ? []
    : [`One of ${requirements.anySkills.map(({ skill, level }) => `${level} ${skill}`).join(', ')}`]
  const completed = recommendation.completionQuest
    ? playerQuestCompleted(player, recommendation.completionQuest) === true
    : manuallyCompleted.has(recommendation.path)
  const missing = [...missingSkills, ...missingQuests, ...missingAnySkill]

  return {
    ...recommendation,
    status: completed ? 'completed' : missing.length === 0 ? 'ready' : 'locked',
    missing,
    manualChecks: requirements.other,
    requirementCount: requirements.skills.length + requirements.quests.length + (requirements.anySkills.length ? 1 : 0),
  }
}

export function evaluateProgression(player: PlayerProfile, manuallyCompleted: ReadonlySet<string> = new Set()) {
  return progressionRecommendations.map((recommendation) => evaluateRecommendation(recommendation, player, manuallyCompleted))
}
