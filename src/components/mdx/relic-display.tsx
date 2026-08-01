import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LeaguesPassiveList, type LeaguesPassive } from '@/components/mdx/leagues-passive-list'
import relicData from '@/data/leagues-ii/relics.json'

type SkillSolve = {
  skill: string
  grade: string
}

type RelicItem = {
  name: string
  tagline: string
  tier: number
  image: string
  effects: string[]
  notes: string[]
  skillSolves: SkillSolve[]
}

type RelicDisplayProps = {
  tier: number
  points?: number
}

function RelicDetail({ relic, onBack }: { relic: RelicItem; onBack: () => void }) {
  return (
    <section className="my-4 border bg-card/50 p-4">
      <div className="flex gap-6 max-[640px]:flex-col">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <Button className="self-start" variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" />
            Back
          </Button>
          <img className="size-[4.5rem] object-contain" src={relic.image} alt="" />
          <h3 className="m-0 text-center font-display text-xl">{relic.name}</h3>
          <div className="grid w-48 grid-cols-2 gap-0.5">
            {relic.skillSolves.map((solve) => (
              <div
                className="flex h-8 items-center border bg-secondary px-2 py-1"
                key={`${relic.name}-${solve.skill}`}
              >
                <img
                  className="mr-2 size-6 object-contain"
                  src={`/skills/${solve.skill}.png`}
                  alt=""
                />
                <span className="font-bold">{solve.grade}</span>
                <span className="sr-only">{solve.skill}</span>
              </div>
            ))}
          </div>
        </div>
        <ScrollArea className="max-h-[18.75rem] min-w-0 flex-1">
          <div className="pr-4">
            <h4 className="m-0 border-b pb-1 font-semibold">Effects</h4>
            <ul className="list-disc pl-6">
              {relic.effects.map((effect) => (
                <li className="my-1" key={`${relic.name}-effect-${effect}`}>{effect}</li>
              ))}
            </ul>
            {relic.notes.length > 0 && (
              <>
                <h4 className="m-0 border-b pb-1 font-semibold">Notes</h4>
                <ul className="list-disc pl-6">
                  {relic.notes.map((note) => (
                    <li className="my-1" key={`${relic.name}-note-${note}`}>{note}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </section>
  )
}

function RelicCards({
  relics,
  onSelect,
}: {
  relics: RelicItem[]
  onSelect: (relic: RelicItem) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
      {relics.map((relic) => (
        <article
          className="flex min-w-0 flex-col items-center justify-between border bg-card/50 p-4"
          key={relic.name}
        >
          <div className="mb-4 flex flex-col items-center">
            <img className="size-32 object-contain" src={relic.image} alt="" />
            <h3 className="mt-4 mb-2 text-center font-display text-xl">{relic.name}</h3>
            <p className="m-0 text-center">{relic.tagline}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onSelect(relic)}>
            View details
          </Button>
        </article>
      ))}
    </div>
  )
}

function RelicDisplay({ tier, points }: RelicDisplayProps) {
  const relics = relicData.Relics.filter((relic) => relic.tier === tier) as RelicItem[]
  const passives = (relicData.Passives.find((entry) => entry.tier === tier)?.effects ?? []) as LeaguesPassive[]
  const [selectedRelic, setSelectedRelic] = useState<RelicItem | null>(null)

  if (tier === 0 && relics.length === 0) return null

  return (
    <section className="my-6">
      {tier === 0 ? (
        <div className="mb-4">
          <h2 className="mb-2 text-xl font-semibold">Unsorted Relics</h2>
          <p className="m-0">These relics have not had their tiers announced yet.</p>
        </div>
      ) : (
        <div className="mb-4 flex items-baseline gap-8">
          <h2 className="m-0 text-xl font-semibold">Tier {tier}</h2>
          {points !== undefined && points > 0 && (
            <span className="text-primary">{points} points</span>
          )}
        </div>
      )}

      <LeaguesPassiveList passives={passives} />

      {relics.length === 0 ? (
        <p className="border bg-card p-4">
          Relics have not been confirmed for this tier yet. Check back soon!
        </p>
      ) : selectedRelic ? (
        <RelicDetail relic={selectedRelic} onBack={() => setSelectedRelic(null)} />
      ) : (
        <RelicCards relics={relics} onSelect={setSelectedRelic} />
      )}
    </section>
  )
}

export { RelicDisplay }
export type { RelicDisplayProps }
