'use client';

import React from 'react';
import relicData from '@/data/leagues-ii/relics.json';

interface RelicItem {
  name: string;
  tier: number;
  image: string;
  effects: string[];
}

interface PassiveEffect {
    title: string;
    description: string;
}

interface RelicDisplayProps {
    tier: number;
    points: number;
}

const RelicList: React.FC<{ relics: RelicItem[]; passives: PassiveEffect[] }> = ({ relics, passives }) => {
  return (
    <div className="table-scroll">
        <table>
            <thead>
            <tr><th>Relic</th><th>Description</th></tr>
            </thead>
            <tbody>
                {relics.map((relic, relicIndex) => (
                    <tr key={relicIndex}>
                        <td><div className="league-relic-name"><img className="league-relic-icon" src={relic.image} alt={relic.name} /><strong>{relic.name}</strong></div></td>
                        <td>
                            <ul className="bulleted-list">
                                {relic.effects?.map((effect, effectIndex) => (
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

export const RelicDisplay: React.FC<RelicDisplayProps> = ({ tier, points }) => {

  const tierData = relicData.Relics.filter((data) => data.tier === tier);
  const tierPassives = relicData.Passives.find((data) => data.tier === tier)?.effects || [];

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
        <RelicList relics={tierData} passives={tierPassives} />
    </div>
  );
};
