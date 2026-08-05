'use client'

import { RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import relicData from '@/data/leagues-ii/relics.json'
import regionSkillGradeData from '@/data/leagues-ii/region-skill-grades.json'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  GUARANTEED_REGION_IDS,
  OPTIONAL_REGION_PICK_COUNT,
} from '@/lib/picks-state'
import { cn } from '@/lib/utils'
import { RegionOutlineMap } from '@/pages/picks/components/RegionOutlineMap'
import {
  TierOptionMatrix,
  type TierOptionMatrixRow,
} from '@/pages/picks/components/TierOptionMatrix'
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

const RELIC_OPTION_ROWS = ['A', 'B', 'C'] as const
const GUARANTEED_REGION_OPTION_ID_SET = new Set<string>(
  GUARANTEED_REGION_IDS,
)
const GRADE_LEGEND: Array<{ grade: SkillGrade; label: string }> = [
  { grade: 'S', label: 'Exceptional' },
  { grade: 'A', label: 'Solved' },
  { grade: 'B', label: 'Strong' },
  { grade: 'C', label: 'Workable' },
  { grade: 'D', label: 'Limited' },
  { grade: 'F', label: 'No practical method' },
]

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
          {result.sourceName ?? 'No route selected'}
        </p>
      </div>
    </div>
  )
}

export function SkillingSolver() {
  const [selectedRelicIds, setSelectedRelicIds] = useState<string[]>([])
  const [selectedRegionOptionIds, setSelectedRegionOptionIds] = useState<
    string[]
  >([...GUARANTEED_REGION_IDS])
  const selectedIdSet = useMemo(
    () => new Set(selectedRelicIds),
    [selectedRelicIds],
  )
  const selectedRelics = useMemo(
    () =>
      SPECULATIVE_RELIC_TIERS.flatMap(({ options }) => options)
        .filter(({ id }) => selectedIdSet.has(id))
        .map(({ label }) => relicByName.get(label))
        .filter((relic): relic is Relic => Boolean(relic)),
    [selectedIdSet],
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
  const toggleRelic = (tier: number, optionId: string) => {
    setSelectedRelicIds((current) => {
      if (current.includes(optionId)) {
        return current.filter((id) => id !== optionId)
      }

      const idsInTier = new Set(
        SPECULATIVE_RELIC_TIERS.find((entry) => entry.tier === tier)?.options.map(
          ({ id }) => id,
        ),
      )
      return [...current.filter((id) => !idsInTier.has(id)), optionId]
    })
  }
  const matrixTiers = SPECULATIVE_RELIC_TIERS.map(({ options, tier }) => ({
    isSelected: options.some(({ id }) => selectedIdSet.has(id)),
    tier,
  }))
  const matrixRows: TierOptionMatrixRow[] = RELIC_OPTION_ROWS.map(
    (optionLetter, optionIndex) => ({
      id: optionLetter,
      cells: SPECULATIVE_RELIC_TIERS.map(({ options, tier }) => {
        const option = options[optionIndex]
        if (!option) return null

        return {
          ariaLabel: `Tier ${tier}, option ${optionLetter}, ${option.label}: ${option.description}`,
          description: option.description,
          fallback: optionLetter,
          id: option.id,
          image: option.icon,
          isSelected: selectedIdSet.has(option.id),
          label: option.label,
          onSelect: () => toggleRelic(tier, option.id),
        }
      }),
    }),
  )

  return (
    <section className="not-prose my-8 overflow-hidden border-y border-border bg-card/10 sm:border-x">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
            Route coverage
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
            Choose regions and relics
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            Your best grade from any selected region or relic determines each
            skill's coverage.
          </p>
        </div>
        <Button
          disabled={
            selectedRelicIds.length === 0 && selectedOptionalRegionCount === 0
          }
          onClick={() => {
            setSelectedRelicIds([])
            setSelectedRegionOptionIds([...GUARANTEED_REGION_IDS])
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden />
          Reset all
        </Button>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black tracking-[0.18em] text-muted-foreground uppercase">
              Regions
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
              Choose up to three optional regions
            </h3>
          </div>
          <span className="shrink-0 text-xs font-semibold text-primary">
            {selectedOptionalRegionCount} of {OPTIONAL_REGION_PICK_COUNT}
          </span>
        </div>
        <div className="mt-3">
          <RegionOutlineMap
            onSelectedRegionIdsChange={setSelectedRegionOptionIds}
            selectedRegionIds={selectedRegionOptionIds}
            showHeader={false}
          />
        </div>

        <div className="mt-7 border-t border-border pt-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black tracking-[0.18em] text-muted-foreground uppercase">
                Relics
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-foreground">
                Choose one relic per tier
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Placements are speculative until every relic tier is confirmed.
              </p>
            </div>
            <span className="shrink-0 text-xs font-semibold text-primary">
              {selectedRelicIds.length} of {SPECULATIVE_RELIC_TIERS.length}
            </span>
          </div>

          <TierOptionMatrix
            ariaLabel="Skilling solve relic options by tier"
            className="relic-grid-scroll"
            rows={matrixRows}
            tiers={matrixTiers}
            variant="relic"
          />
        </div>
      </div>

      <div aria-live="polite" className="border-t border-border bg-background/40 px-4 py-5 sm:px-6">
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
            {Math.round((solvedCount / SKILLS.length) * 100)}%
          </span>
        </div>
        <Progress className="mt-3" max={SKILLS.length} value={solvedCount} />

        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Grades compare the best repeatable training method available from your
          route, including the resources needed to sustain it.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-y border-border py-3">
          {GRADE_LEGEND.map(({ grade, label }) => (
            <span
              className="flex items-center gap-1.5 text-[10px] text-muted-foreground"
              key={grade}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border text-[9px] font-black',
                  grade === 'S' || grade === 'A'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-muted text-muted-foreground',
                )}
              >
                {grade}
              </span>
              {label}
            </span>
          ))}
        </div>

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
    </section>
  )
}
