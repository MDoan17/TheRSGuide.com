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
}

interface PassiveEffect {
    title: string;
    description: string;
}

interface BlessingDisplayProps {
    tier: number;
    tasks: number;
}

const BlessingList: React.FC<{ blessings: BlessingItem[]; passives: PassiveEffect[] }> = ({ blessings, passives }) => {
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
                            </ul>
                        </td>
                    </tr>
                ))}
            {passives.map((passive, passiveIndex) => (
                <tr key={passiveIndex}>
                    <td><strong>Passive: {passive.title}</strong></td>
                    <td>{passive.description}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
  );
};

export const BlessingDisplay: React.FC<BlessingDisplayProps> = ({ tier, tasks }) => {

  const tierData = blessingData.Blessings.filter((data) => data.tier === tier);
  const tierPassives = blessingData.Passives.find((data) => data.tier === tier)?.effects || [];

  if (tierData.length === 0 && tier !== 0) {
    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Tier {tier}</h2>
            <div className="bg-card p-4">Blessings have not been confirmed for this tier yet. Check back soon!</div>
        </div>
    )
  } else if (tierData.length === 0 && tier === 0) { // Hides unsorted blessings if there are none
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
                {tasks > 0 && <span className="text-secondary-foreground">{tasks} Blessing tasks</span>}
            </div>
        )}
        <BlessingList blessings={tierData} passives={tierPassives} />
    </div>
  );
};
