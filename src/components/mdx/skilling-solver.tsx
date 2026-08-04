'use client'

import { Check, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'

import relicData from '@/data/leagues-ii/relics.json'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { SPECULATIVE_RELIC_TIERS } from '../../../shared/speculative-relic-options'

export type SkillGrade = 'S' | 'A' | 'B' | 'C'

type SkillSolve = {
  grade: SkillGrade
  skill: string
}

type Relic = {
  image: string
  name: string
  skillSolves: SkillSolve[]
  tagline: string
  tier: number
}

type SpeculativeRelicOption =
  (typeof SPECULATIVE_RELIC_TIERS)[number]['options'][number]

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
  S: 4,
  A: 3,
  B: 2,
  C: 1,
}

const relics = relicData.Relics as Relic[]
const relicByName = new Map(relics.map((relic) => [relic.name, relic]))

export function calculateSkillResults(selectedRelics: Relic[]) {
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

  return results
}

function RelicOption({
  isSelected,
  onSelect,
  option,
}: {
  isSelected: boolean
  onSelect: () => void
  option: SpeculativeRelicOption
}) {
  return (
    <button
      aria-label={`${isSelected ? 'Remove' : 'Select'} ${option.label}: ${option.description}`}
      aria-pressed={isSelected}
      className={cn(
        'group relative flex min-h-32 flex-col items-center justify-start gap-2 border-r border-b border-border px-2 py-3 text-center transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-card/30 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
      onClick={onSelect}
      title={option.description}
      type="button"
    >
      {isSelected && (
        <Check aria-hidden className="absolute top-2 right-2 size-3" />
      )}
      <img
        alt=""
        aria-hidden
        className={cn(
          'h-16 w-16 object-contain transition-[opacity,transform] duration-200 group-hover:scale-105',
          isSelected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
        )}
        draggable={false}
        height={64}
        src={option.icon}
        width={64}
      />
      <span className="text-[10px] font-black leading-tight tracking-[0.08em] uppercase">
        {option.label}
      </span>
    </button>
  )
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

export function SkillingSolver() {
  const [selectedRelicIds, setSelectedRelicIds] = useState<string[]>([])
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
  const results = useMemo(
    () => calculateSkillResults(selectedRelics),
    [selectedRelics],
  )
  const solvedCount = Array.from(results.values()).filter(
    ({ isSolved }) => isSolved,
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

  return (
    <section className="not-prose my-8 overflow-hidden border-y border-border bg-card/10 sm:border-x">
      <div className="flex flex-col gap-4 border-b border-border px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-primary uppercase">
            Relic coverage
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-foreground">
            Choose your relics
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            A skill is solved when one of your relics gives it an A or S grade.
          </p>
        </div>
        <Button
          disabled={selectedRelicIds.length === 0}
          onClick={() => setSelectedRelicIds([])}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw aria-hidden />
          Reset
        </Button>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-3">
          <p className="text-xs leading-5 text-muted-foreground">
            Placements are speculative until every relic tier is confirmed.
          </p>
          <span className="shrink-0 text-xs font-semibold text-primary">
            {selectedRelicIds.length} of {SPECULATIVE_RELIC_TIERS.length}
          </span>
        </div>

        {SPECULATIVE_RELIC_TIERS.map(({ options, tier }, tierIndex) => (
            <div
              className={cn(tierIndex < SPECULATIVE_RELIC_TIERS.length - 1 && 'mb-6')}
              key={tier}
            >
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-lg font-semibold text-foreground">
                  Tier {tier}
                </h3>
                <span className="text-xs text-muted-foreground">Choose one</span>
              </div>
              <div
                className="grid border-t border-l border-border"
                style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
              >
                {options.map((option) => (
                  <RelicOption
                    isSelected={selectedIdSet.has(option.id)}
                    key={option.id}
                    onSelect={() => toggleRelic(tier, option.id)}
                    option={option}
                  />
                ))}
              </div>
            </div>
        ))}
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

export type { Relic }
