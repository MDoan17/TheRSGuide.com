import { describe, expect, it } from 'vitest'
import {
  displayRegionId,
  displayRegions,
  leaguesRegionGuidePaths,
  regionGuidePath,
  type RegionMapData,
} from './leagues-region-map'

const mapData: RegionMapData = {
  columns: 2,
  rows: 1,
  pixels: [['asgarnia', 'troll-country']],
  regions: [
    {
      id: 'asgarnia',
      name: 'Asgarnia',
      color: '#111111',
      hoverColor: '#ffffff',
    },
    {
      id: 'troll-country',
      name: 'Troll Country',
      color: '#222222',
      hoverColor: '#ffffff',
    },
  ],
  superRegions: [{
    id: 'troll-country-asgarnia',
    name: 'Troll Country & Asgarnia',
    regionIds: ['troll-country', 'asgarnia'],
  }],
}

describe('Leagues region map', () => {
  it('groups source regions into one displayed destination', () => {
    expect(displayRegionId(mapData, 'troll-country')).toBe('troll-country-asgarnia')
    expect(displayRegions(mapData)).toEqual([{
      id: 'troll-country-asgarnia',
      name: 'Troll Country & Asgarnia',
      color: '#111111',
      hoverColor: '#ffffff',
      regionIds: ['troll-country', 'asgarnia'],
    }])
  })

  it('maps every displayed map region directly to a Regions guide', () => {
    for (const [regionId, path] of Object.entries(leaguesRegionGuidePaths)) {
      expect(regionGuidePath(regionId)).toBe(path)
      expect(path).toMatch(/^\/leagues\/regions\/[a-z0-9-]+$/)
    }
    expect(regionGuidePath('unknown')).toBe('/leagues/regions')
  })
})
