import type { EvaluatedRecommendation, ProgressionStage } from '@/lib/player-progression'

export interface PlayerSuggestion {
  recommendation: EvaluatedRecommendation
  kind: 'ready' | 'close'
  reason: string
}

const stageOrder: Record<ProgressionStage, number> = {
  early: 0,
  mid: 1,
  late: 2,
}

const impactOrder = new Map([
  'Succession',
  'The World Wakes',
  'Desert Treasure',
  'Lunar Diplomacy',
  'Devotion Ability',
  'Ancient Curses',
  'Prifddinas',
  'Invention',
  'City of Senntisten',
  'Double Surge',
  'Overloads',
  'Extinction',
  'Zuk Cape',
].map((title, index) => [title, index]))

function impactRank(recommendation: EvaluatedRecommendation) {
  return impactOrder.get(recommendation.title) ?? 50
}

function readyScore(recommendation: EvaluatedRecommendation) {
  return stageOrder[recommendation.stage] * 100 + impactRank(recommendation)
}

function closeScore(recommendation: EvaluatedRecommendation) {
  return recommendation.missing.length * 100 + stageOrder[recommendation.stage] * 25 + impactRank(recommendation)
}

function readyReason(recommendation: EvaluatedRecommendation) {
  if (recommendation.completionQuest) {
    return `All tracked requirements are met. Complete ${recommendation.completionQuest} to finish this recommendation.`
  }
  if (recommendation.manualChecks.length) {
    return `Your tracked requirements are met. Next: ${recommendation.manualChecks[0]}.`
  }
  return `All tracked requirements are met. ${recommendation.description}`
}

function closeReason(recommendation: EvaluatedRecommendation) {
  const requirements = recommendation.missing.slice(0, 2).join(' and ')
  const remainder = recommendation.missing.length > 2
    ? `, plus ${recommendation.missing.length - 2} more requirement${recommendation.missing.length - 2 === 1 ? '' : 's'}`
    : ''
  return `Build toward ${requirements}${remainder}. ${recommendation.description}`
}

export function getPlayerSuggestions(
  recommendations: EvaluatedRecommendation[],
  limit = 5,
): PlayerSuggestion[] {
  const ready = recommendations
    .filter((recommendation) => recommendation.status === 'ready')
    .sort((a, b) => readyScore(a) - readyScore(b))
  const close = recommendations
    .filter((recommendation) => recommendation.status === 'locked')
    .sort((a, b) => closeScore(a) - closeScore(b))

  const readyLimit = close.length ? Math.min(ready.length, Math.max(1, limit - 1)) : limit
  const selectedReady = ready.slice(0, readyLimit).map((recommendation) => ({
    recommendation,
    kind: 'ready' as const,
    reason: readyReason(recommendation),
  }))
  const selectedClose = close.slice(0, limit - selectedReady.length).map((recommendation) => ({
    recommendation,
    kind: 'close' as const,
    reason: closeReason(recommendation),
  }))

  return [...selectedReady, ...selectedClose]
}
