'use client'

import React, { useState } from 'react'
import { LeaguesPassiveList, type LeaguesPassive } from '@/components/mdx/leagues-passive-list'
import { PickerBlessingDetailsDrawer } from '@/pages/picks/components/PickerBlessingDetailsDrawer'

import blessingData from '@/data/leagues-ii/blessings.json'
import '@/styles/blessings.css'

type BlessingItem = {
  name: string
  tagline: string
  path: string
  tier: number
  image?: string
  effects: string[]
  notes: string[]
}

type BlessingDisplayProps = {
  tier: number
  tasks?: number
}

const BlessingCards: React.FC<{ blessings: BlessingItem[]; onViewBlessing: (r: BlessingItem) => void }> = ({ blessings, onViewBlessing }) => {
  return (
    <div className="blessings-container mx-auto my-0">
        {blessings.map((blessing) => (
            <div key={blessing.name} className={`blessing-card ${blessing.path.toLowerCase()} bg-card/50 flex flex-col items-center p-4 border grow shrink basis-[30%] justify-between`}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                    {blessing.image && (
                        <img src={blessing.image} alt={blessing.name} style={{ width: '128px' }} />
                    )}
                    <span className="font-display text-xl mt-4 mb-2 text-center">{blessing.name}</span>
                    <p className="mb-2 text-center text-secondary-foreground">{blessing.tagline}</p>
                </div>
                <button type="button" onClick={() => onViewBlessing(blessing)} className="text-card-foreground text-sm border border-primary rounded-md px-4 py-2 hover:bg-accent">View Details</button>
            </div>
        ))}
    </div>
  );
};

function BlessingDisplay({ tier, tasks }: BlessingDisplayProps) {
  const blessings = blessingData.Blessings.filter((blessing) => blessing.tier === tier) as BlessingItem[]
  const passives = (blessingData.Passives.find((entry) => entry.tier === tier)?.effects ?? []) as LeaguesPassive[]
  
      const [selectedBlessing, setSelectedBlessing] = useState<BlessingItem | null>(null);

  if (tier === 0 && blessings.length === 0) return null

  return (
        <section>
            {tier === 0 ? (
                <>
                    <h2>Unsorted Blessings</h2>
                    <span>These blessings have not had their tiers announced yet.</span>
                </>
            ) : (
                <div className="flex items-baseline gap-8 mb-4">
                    <h2 className="text-xl font-semibold mb-4">Tier {tier}</h2>
                    { tasks !== undefined && tasks > 0 && (
                        <span className="text-secondary-foreground">{tasks} tasks</span>
                    )}
                </div>
            )}

            { passives.length > 0 && (
                <div className="mb-2">
                    <span className="text-lg font-semibold mb-2">Passives</span>
                    <LeaguesPassiveList passives={passives} />
                </div>
            )}
            
            { blessings.length === 0 && tier !== 0 ? (
                <div>
                    <div className="bg-card p-4">Blessings have not been confirmed for this tier yet. Check back soon!</div>
                </div>
            ) : (
                <BlessingCards blessings={blessings} onViewBlessing={(b) => setSelectedBlessing(b)} />
            )}
            
            <PickerBlessingDetailsDrawer
                blessing={selectedBlessing ?? null}
                onOpenChange={(open) => {
                    if (!open) setSelectedBlessing(null)
                }}
            />
        </section>
  )
}

export { BlessingDisplay }
export type { BlessingDisplayProps, BlessingItem }
