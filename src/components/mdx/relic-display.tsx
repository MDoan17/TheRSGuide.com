'use client';

import React, { useState } from 'react';
import relicData from '@/data/leagues-ii/relics.json';
import { LeaguesPassiveList, type LeaguesPassive } from '@/components/mdx/leagues-passive-list'
import { PickerRelicDetailsDrawer } from '@/pages/picks/components/PickerRelicDetailsDrawer'

import '@/styles/relics.css';

interface RelicItem {
  name: string;
  tagline: string;
  tier: number;
  slot: number;
  image: string;
  effects: string[];
  notes: string[];
  skillSolves: SkillSolves[];
}

interface RelicDisplayProps {
    tier: number;
    points: number;
}

interface SkillSolves {
    skill: string;
    grade: string;
}

const RelicCards: React.FC<{ relics: RelicItem[]; onViewRelic: (r: RelicItem) => void }> = ({ relics, onViewRelic }) => {
  return (
    <div className="relics-container mx-auto my-0">
        {relics.map((relic, relicIndex) => (
            <div key={relicIndex} className="bg-card/50 flex flex-col items-center p-4 border grow shrink basis-[30%] justify-between">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>
                    <img src={relic.image} alt={relic.name} style={{ width: '128px' }} />
                    <span className="font-display text-xl mt-4 mb-2 text-center">{relic.name}</span>
                    <p className="mb-2 text-center text-secondary-foreground">{relic.tagline}</p>
                </div>
                <button type="button" onClick={() => onViewRelic(relic)} className="text-card-foreground text-sm border border-primary rounded-md px-4 py-2 hover:bg-accent">View Details</button>
            </div>
        ))}
    </div>
  );
};

function RelicDisplay({ tier, points }: RelicDisplayProps) {

    const relics = relicData.Relics
      .filter((relic) => relic.tier === tier)
      .sort((left, right) => left.slot - right.slot) as RelicItem[]
    const passives = (relicData.Passives.find((entry) => entry.tier === tier)?.effects ?? []) as LeaguesPassive[]

    const [selectedRelic, setSelectedRelic] = useState<RelicItem | null>(null);

    if (relics.length === 0 && tier === 0) return null;

      return (
        <section>
            {tier === 0 ? (
                <>
                    <h2>Unsorted Relics</h2>
                    <span>These relics have not had their tiers announced yet.</span>
                </>
            ) : (
                <div className="flex items-baseline gap-8 mb-4">
                    <h2 className="text-xl font-semibold mb-4">Tier {tier}</h2>
                    { points !== undefined && points > 0 && (
                        <span className="text-secondary-foreground">{points} points</span>
                    )}
                </div>
            )}

            { passives.length > 0 && (
                <div className="mb-2">
                    <span className="text-lg font-semibold mb-2">Passives</span>
                    <LeaguesPassiveList passives={passives} />
                </div>
            )}

            { relics.length === 0 && tier !== 0 ? (
                <div>
                    <div className="bg-card p-4">Relics have not been confirmed for this tier yet. Check back soon!</div>
                </div>
            ) : (
                <RelicCards relics={relics} onViewRelic={(r) => setSelectedRelic(r)} />
            )}

            <PickerRelicDetailsDrawer
                isSpeculative={false}
                relic={selectedRelic ?? null}
                tier={selectedRelic?.tier}
                onOpenChange={(open) => {
                if (!open) setSelectedRelic(null)
                }}
            />
        </section>
      );
};

export { RelicDisplay };
export type { RelicDisplayProps, RelicItem };
