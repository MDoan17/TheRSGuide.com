'use client';

import React from 'react';
import blessingData from '@/data/leagues-ii/blessings.json';

type Path = 'Chaos' | 'Balance' | 'Order';

interface BlessingItem {
  name: string;
  path: Path | string;
  tier: number;
  image: string;
  effects: string[];
  notes: string[];
}

interface PassiveEffect {
    title: string;
}

interface BlessingDisplayProps {
    tier: number;
    tasks?: number;
}

const BlessingList: React.FC<{ blessings: BlessingItem[] }> = ({ blessings }) => {
  return (
    <div className="table-scroll">
        <table>
            <thead>
            <tr><th>Blessing</th><th>Path</th><th>Description</th></tr>
            </thead>
            <tbody>
                {blessings.map((blessing, blessingIndex) => (
                    <tr key={blessingIndex}>
                        <td><div className="league-relic-name"><img className="league-relic-icon" src={blessing.image} alt={blessing.name} /><strong>{blessing.name}</strong></div></td>
                        <td>{blessing.path}</td>
                        <td>
                            <ul className="bulleted-list">
                                {blessing.effects?.map((effect, effectIndex) => (
                                    <li key={effectIndex}>{effect}</li>
                                ))}
                                {blessing.notes?.map((note, noteIndex) => (
                                    <li key={noteIndex}>{note}</li>
                                ))}
                            </ul>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
  );
};

const BlessingPassives: React.FC<{ effects: PassiveEffect[]; tier: number }> = ({ effects, tier }) => {
    if (effects.length === 0) return null;

    return (
        <section className="relic-passives" aria-labelledby={`blessing-tier-${tier}-passives`}>
            <div className="relic-passives-header">
                <div className="relic-passives-title" id={`blessing-tier-${tier}-passives`}>Tier {tier} Passives</div>
            </div>
            <ul className="relic-passives-list">
                {effects.map((passive) => (
                    <li key={passive.title}>{passive.title}</li>
                ))}
            </ul>
        </section>
    );
};

export const BlessingDisplay: React.FC<BlessingDisplayProps> = ({ tier, tasks }) => {

  const tierData = blessingData.Blessings.filter((data) => data.tier === tier);
  const tierPassives = blessingData.Passives.find((data) => data.tier === tier)?.effects || [];

  if (tierData.length === 0 && tier === 0) { // Hides unsorted blessings if there are none
    return (
        <></>
    );
  }

  return (
    <div>
        {tier === 0 ? (
            <>
                <h2>Unsorted Blessings</h2>
                <span>These blessings have not had their tiers announced yet.</span>
            </>
        ) : (
            <div className="flex items-baseline gap-8 mb-4">
                <h2 className="text-xl font-semibold mb-4">Tier {tier}</h2>
                {tasks !== undefined && tasks > 0 && <span className="text-secondary-foreground">{tasks} Blessing tasks</span>}
            </div>
        )}
        {tierData.length === 0 ? (
            <div className="bg-card p-4">Blessings have not been confirmed for this tier yet. Check back soon!</div>
        ) : (
            <BlessingList blessings={tierData} />
        )}
        <BlessingPassives effects={tierPassives} tier={tier} />
    </div>
  );
};
