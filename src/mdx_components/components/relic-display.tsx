'use client';

import React, { useState } from 'react';
import relicData from '@/data/leagues-ii/relics.json';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RelicItem {
  name: string;
  tagline: string;
  tier: number;
  image: string;
  effects: string[];
  notes: string[];
  skillSolves: SkillSolves[];
}

interface PassiveEffect {
    title: string;
    description: string;
}

interface RelicDisplayProps {
    tier: number;
    points: number;
}

interface SkillSolves {
    skill: string;
    grade: string;
}

const RelicDetailView: React.FC<{ relic: RelicItem; onBack: () => void }> = ({ relic, onBack }) => {
    return (
        <div className="bg-card/50 border my-4 overflow-hidden">
            <div className="bg-card/95 border-b p-3">
                <button onClick={onBack} className="text-card-foreground text-sm border border-primary rounded-md px-4 py-2 hover:bg-accent"><ArrowLeft className="inline-block w-4 h-4 mr-2" />Back</button>
            </div>
            <ScrollArea type="always" className="h-[min(65svh,32rem)] sm:h-[300px]">
                <div className="flex flex-col gap-6 p-4 sm:flex-row sm:items-start">
                    <div className="flex flex-col items-center gap-2 sm:w-48 sm:shrink-0">
                        <img src={relic.image} alt={relic.name} style={{ width: '72px' }} />
                        <span className="font-display text-xl">{relic.name}</span>
                        <div className="flex flex-wrap justify-center gap-0.5 w-48">
                            {relic.skillSolves.map((solve, solveIndex) => (
                                <div className="bg-secondary py-1 px-2 flex w-18 h-8 border items-center" key={solveIndex}>
                                    <img src={`/skills/${solve.skill}.png`} alt={solve.skill} className="w-6 mr-2 object-contain" />
                                    <span key={solveIndex} className="mr-2 font-bold">{solve.grade}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="min-w-0 w-full flex-1">
                        <div>
                            <p className="w-full border-b font-semibold">Effects</p>
                            <ul className="bulleted-list">
                                {relic.effects.map((effect, effectIndex) => (
                                    <li key={effectIndex}>{effect}</li>
                                ))}
                            </ul>
                        </div>
                        {relic.notes.length > 0 && (
                            <div>
                                <p className="w-full border-b font-semibold">Notes</p>
                                <ul className="bulleted-list">
                                    {relic.notes.map((note, noteIndex) => (
                                        <li key={noteIndex}>{note}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

const RelicCards: React.FC<{ relics: RelicItem[]; onViewRelic: (r: RelicItem) => void }> = ({ relics, onViewRelic }) => {
  return (
    <>
        <div className="flex flex-col gap-4 mx-auto my-0 sm:flex-row sm:flex-wrap">
            {relics.map((relic, relicIndex) => (
                <div key={relicIndex} className="bg-card/50 grid w-full grid-cols-[6rem_minmax(0,1fr)] items-stretch gap-x-4 p-4 border sm:flex sm:w-auto sm:grow sm:shrink sm:basis-[30%] sm:flex-col sm:items-center sm:gap-0">
                    <div className="flex h-full items-center justify-center sm:h-auto">
                        <img src={relic.image} alt={relic.name} className="w-24 max-w-full sm:w-32 sm:max-w-none" />
                    </div>
                    <div className="flex min-w-0 flex-col items-start sm:w-full sm:flex-1 sm:items-center">
                        <span className="font-display text-xl mb-1 sm:mt-4 sm:mb-2">{relic.name}</span>
                        <p className="m-0 text-left sm:mb-3 sm:text-center">{relic.tagline}</p>
                        <button onClick={() => onViewRelic(relic)} className="text-card-foreground text-sm border border-primary rounded-md w-full px-4 py-2 mt-2 hover:bg-accent sm:w-auto sm:mt-auto">View Details</button>
                    </div>
                </div>
            ))}
        </div>
    </>
  );
};

export const RelicDisplay: React.FC<RelicDisplayProps> = ({ tier, points }) => {

    const tierData = relicData.Relics.filter((data) => data.tier === tier);
    const tierPassives = relicData.Passives.find((data) => data.tier === tier)?.effects || [] as PassiveEffect[];

    const [selectedRelic, setSelectedRelic] = useState<RelicItem | null>(null);

    if (tierData.length === 0 && tier !== 0) {
        return (
                <div>
                        <h2 className="text-xl font-semibold mb-4">Tier {tier}</h2>
                        <div className="bg-card p-4">Relics have not been confirmed for this tier yet. Check back soon!</div>
                </div>
        )
    } else if (tierData.length === 0 && tier === 0) { // Hides unsorted relics if there are none
        return (
                <></>
        );
    }

      return (
        <div>
            {tier === 0 ? (
                <>
                    <h2>Unsorted Relics</h2>
                    <span>These relics have not had their tiers announced yet.</span>
                </>
            ) : (
                <div className="flex items-baseline gap-8 mb-4">
                    <h2 className="text-xl font-semibold mb-4">Tier {tier}</h2>
                    <span className="text-secondary-foreground">{points} points</span>
                </div>
            )}

            { tierPassives.length > 0 && (
                <div className="mb-2">
                    <span className="text-lg font-semibold mb-2">Passives</span>
                    <ul className="bulleted-list">
                        {tierPassives.map((passive, passiveIndex) => (
                            <li key={passiveIndex}><strong>{passive.title}:</strong> {passive.description}</li>
                        ))}
                    </ul>
                </div>
            )}

            {selectedRelic ? (
                <RelicDetailView relic={selectedRelic} onBack={() => setSelectedRelic(null)} />
            ) : (
                <RelicCards relics={tierData} onViewRelic={(r) => setSelectedRelic(r)} />
            )}
        </div>
      );
};
