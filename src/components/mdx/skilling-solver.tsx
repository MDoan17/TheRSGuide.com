'use client'

import { RotateCcw } from 'lucide-react'
import { useMemo } from 'react'

import relicData from '@/data/leagues-ii/relics.json'
import regionSkillGradeData from '@/data/leagues-ii/region-skill-grades.json'
import { Progress } from '@/components/ui/progress'
import { usePersistedPicksState } from '@/hooks/use-persisted-picks-state'
import {
  GUARANTEED_REGION_IDS,
  RELIC_TIERS,
} from '@/lib/picks-state'
import { cn } from '@/lib/utils'
import { RegionOutlineMap } from '@/pages/picks/components/RegionOutlineMap'
import { RelicSelector } from '@/pages/picks/components/RelicSelector'
import { LEAGUE_OPTIONS } from '../../../shared/league-options'
import { SPECULATIVE_RELIC_TIERS } from '../../../shared/speculative-relic-options'

export type SkillGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F'

type SkillSolve = {
  grade: SkillGrade
  skill: string
}

export type Relic = {
  image: string
  name: string
  skillSolves: SkillSolve[]
  tagline: string
  tier: number
}

export type RegionSkillGrades = {
  grades: Record<string, SkillGrade>
  id: string
  name: string
}

export type SkillResult = {
  grade: SkillGrade | null
  isSolved: boolean
  sourceName: string | null
}

const SKILLS = [
  ['attack', 'Attack'],
  ['strength', 'Strength'],
  ['defence', 'Defence'],
  ['constitution', 'Constitution'],
  ['ranged', 'Ranged'],
  ['prayer', 'Prayer'],
  ['magic', 'Magic'],
  ['cooking', 'Cooking'],
  ['woodcutting', 'Woodcutting'],
  ['fletching', 'Fletching'],
  ['fishing', 'Fishing'],
  ['firemaking', 'Firemaking'],
  ['crafting', 'Crafting'],
  ['smithing', 'Smithing'],
  ['mining', 'Mining'],
  ['herblore', 'Herblore'],
  ['agility', 'Agility'],
  ['thieving', 'Thieving'],
  ['slayer', 'Slayer'],
  ['farming', 'Farming'],
  ['runecrafting', 'Runecrafting'],
  ['hunter', 'Hunter'],
  ['construction', 'Construction'],
  ['summoning', 'Summoning'],
  ['dungeoneering', 'Dungeoneering'],
  ['divination', 'Divination'],
  ['invention', 'Invention'],
  ['archaeology', 'Archaeology'],
  ['necromancy', 'Necromancy'],
] as const

const GRADE_RANK: Record<SkillGrade, number> = {
  S: 6,
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  F: 1,
}

const GUARANTEED_REGION_OPTION_ID_SET = new Set<string>(
  GUARANTEED_REGION_IDS,
)
const relics = relicData.Relics as Relic[]
const relicByName = new Map(relics.map((relic) => [relic.name, relic]))
const regionGrades = regionSkillGradeData.regions as RegionSkillGrades[]
const regionGradeById = new Map(
  regionGrades.map((region) => [region.id, region]),
)
const regionOptions = [...LEAGUE_OPTIONS.regions].sort(
  (left, right) =>
    Number(GUARANTEED_REGION_OPTION_ID_SET.has(right.id)) -
    Number(GUARANTEED_REGION_OPTION_ID_SET.has(left.id)),
)

export function calculateSkillResults(
  selectedRelics: Relic[],
  selectedRegions: RegionSkillGrades[] = [],
) {
  const results = new Map<string, SkillResult>()

  SKILLS.forEach(([skill]) => {
    results.set(skill, { grade: null, isSolved: false, sourceName: null })
  })

  selectedRelics.forEach((relic) => {
    relic.skillSolves.forEach(({ grade, skill }) => {
      const current = results.get(skill)
      if (!current || (current.grade && GRADE_RANK[current.grade] >= GRADE_RANK[grade])) {
        return
      }

      results.set(skill, {
        grade,
        isSolved: grade === 'S' || grade === 'A',
        sourceName: relic.name,
      })
    })
  })

  selectedRegions.forEach((region) => {
    Object.entries(region.grades).forEach(([skill, grade]) => {
      const current = results.get(skill)
      if (!current || (current.grade && GRADE_RANK[current.grade] >= GRADE_RANK[grade])) {
        return
      }

      results.set(skill, {
        grade,
        isSolved: grade === 'S' || grade === 'A',
        sourceName: region.name,
      })
    })
  })

  return results
}

function getRegionGradesForOptions(regionOptionIds: readonly string[]) {
  const selectedOptionIdSet = new Set(regionOptionIds)

  return regionOptions
    .filter(({ id }) => selectedOptionIdSet.has(id))
    .flatMap(({ regionIds }) => regionIds)
    .map((regionId) => regionGradeById.get(regionId))
    .filter((region): region is RegionSkillGrades => Boolean(region))
}

function SkillCell({
  label,
  result,
  skill,
}: {
  label: string
  result: SkillResult
  skill: string
}) {
  return (
    <div
      className={cn(
        'flex min-h-20 items-center gap-3 border-r border-b border-border px-3 py-2 transition-colors duration-200',
        result.isSolved ? 'bg-primary/[0.08]' : 'bg-card/20',
      )}
    >
      <img
        alt=""
        aria-hidden
        className={cn('size-8 object-contain', !result.grade && 'grayscale opacity-45')}
        height={32}
        src={`/skills/${skill}.png`}
        width={32}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-foreground">{label}</span>
          <span
            aria-label={result.grade ? `Grade ${result.grade}` : 'No grade'}
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-black',
              result.isSolved
                ? 'border-primary bg-primary text-primary-foreground'
                : result.grade
                  ? 'border-border bg-muted text-muted-foreground'
                  : 'border-border/70 text-muted-foreground/60',
            )}
          >
            {result.grade ?? '—'}
          </span>
        </div>
        <p className="mt-1 truncate text-[11px] text-muted-foreground">
          {result.sourceName ?? 'No relic option'}
        </p>
      </div>
    </div>
  )
}

function useSkillCoverage() {
  const { picksState, updatePicksState } = usePersistedPicksState()
  const selectedRelicIds = [
    ...Object.values(picksState.selectedRelics),
    picksState.selectedRejuvenatedRelic,
  ].filter(Boolean)
  const selectedRegionOptionIds = picksState.selectedRegionIds
  const displayedRelicTiers = picksState.isSpeculativeRelics
    ? SPECULATIVE_RELIC_TIERS
    : RELIC_TIERS
  const selectedRelics = useMemo(
    () => {
      const selectedIdSet = new Set(selectedRelicIds)
      return displayedRelicTiers
        .flatMap(({ options }) => options)
        .filter(({ id }) => selectedIdSet.has(id))
        .map(({ label }) => relicByName.get(label))
        .filter((relic): relic is Relic => Boolean(relic))
    },
    [displayedRelicTiers, selectedRelicIds],
  )
  const selectedRegionGrades = useMemo(
    () => getRegionGradesForOptions(selectedRegionOptionIds),
    [selectedRegionOptionIds],
  )
  const results = useMemo(
    () => calculateSkillResults(selectedRelics, selectedRegionGrades),
    [selectedRegionGrades, selectedRelics],
  )
  const solvedCount = Array.from(results.values()).filter(
    ({ isSolved }) => isSolved,
  ).length
  const selectedOptionalRegionCount = selectedRegionOptionIds.filter(
    (regionId) => !GUARANTEED_REGION_OPTION_ID_SET.has(regionId),
  ).length

  return {
    isSpeculativeRelics: picksState.isSpeculativeRelics,
    results,
    selectedOptionalRegionCount,
    selectedRejuvenatedRelic: picksState.selectedRejuvenatedRelic,
    selectedRegionOptionIds,
    selectedRelicsByTier: picksState.selectedRelics,
    solvedCount,
    updatePicksState,
  }
}

function SkillCoveragePanel({
  results,
  solvedCount,
}: {
  results: Map<string, SkillResult>
  solvedCount: number
}) {
  const percentage = Math.round((solvedCount / SKILLS.length) * 100)

  return (
    <div
      aria-live="polite"
      className="border-t border-border bg-background/40 px-4 py-5 sm:px-6"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
            Skill coverage
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold text-foreground">
            {solvedCount} of {SKILLS.length} skills solved
          </h3>
        </div>
        <span className="text-sm font-semibold text-primary">
          {percentage}%
        </span>
      </div>
      <Progress className="mt-3" max={SKILLS.length} value={solvedCount} />

      <div className="mt-5 grid border-t border-l border-border sm:grid-cols-2 lg:grid-cols-3">
        {SKILLS.map(([skill, label]) => (
          <SkillCell
            key={skill}
            label={label}
            result={results.get(skill)!}
            skill={skill}
          />
        ))}
      </div>
    </div>
  )
}

export function SkillingSolver() {
  const {
    isSpeculativeRelics,
    results,
    selectedOptionalRegionCount,
    selectedRejuvenatedRelic,
    selectedRegionOptionIds,
    selectedRelicsByTier,
    solvedCount,
    updatePicksState,
  } = useSkillCoverage()
  return (
    <section className="leagues-picker not-prose my-8 overflow-hidden border-y border-border bg-card/10 sm:border-x">
      <div className="px-4 py-5 sm:px-6">
        <RelicSelector
          isSpeculative={isSpeculativeRelics}
          onChange={(selectedRelics) => updatePicksState({ selectedRelics })}
          onRejuvenatedRelicChange={(selectedRejuvenatedRelic) =>
            updatePicksState({ selectedRejuvenatedRelic })
          }
          onSpeculativeChange={(isSpeculativeRelics) =>
            updatePicksState({ isSpeculativeRelics })
          }
          selectedRejuvenatedRelic={selectedRejuvenatedRelic}
          selectedRelics={selectedRelicsByTier}
        />

        <div className="mt-7 flex items-end justify-between gap-4 border-t border-border pt-5">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-muted-foreground uppercase">
              Regions
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
              2. Choose up to three optional regions
            </h3>
          </div>
          <button
            aria-label="Reset region picks"
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-primary/50 text-primary transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:border-border disabled:text-muted-foreground disabled:hover:bg-transparent"
            disabled={selectedOptionalRegionCount === 0}
            onClick={() =>
              updatePicksState({
                selectedRegionIds: [...GUARANTEED_REGION_IDS],
              })
            }
            title="Reset region picks"
            type="button"
          >
            <RotateCcw aria-hidden className="size-3.5" />
          </button>
        </div>
        <div className="mt-3">
          <RegionOutlineMap
            onSelectedRegionIdsChange={(selectedRegionIds) =>
              updatePicksState({ selectedRegionIds })
            }
            selectedRegionIds={selectedRegionOptionIds}
            showHeader={false}
          />
        </div>

      </div>

      <SkillCoveragePanel results={results} solvedCount={solvedCount} />
    </section>
  )
}
