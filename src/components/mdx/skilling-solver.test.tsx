import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import relicData from '@/data/leagues-ii/relics.json'
import regionSkillGradeData from '@/data/leagues-ii/region-skill-grades.json'
import {
  calculateSkillResults,
  SkillingSolver,
  type RegionSkillGrades,
  type Relic,
} from '@/components/mdx/skilling-solver'
import { mdxComponents } from '@/mdx_components/mdx-components'
import { TooltipProvider } from '@/components/ui/tooltip'

const regionGrades = regionSkillGradeData.regions as RegionSkillGrades[]
const getRegions = (regionIds: string[]) =>
  regionGrades.filter(({ id }) => regionIds.includes(id))

describe('SkillingSolver', () => {
  it('uses the best selected relic grade and only solves skills at A or S', () => {
    const selectedRelics = relicData.Relics.filter(({ name }) =>
      ['Divine Druid', 'Golden Touch'].includes(name),
    ) as Relic[]

    const results = calculateSkillResults(selectedRelics)

    expect(results.get('summoning')).toEqual({
      grade: 'A',
      isSolved: true,
      sourceName: 'Divine Druid',
    })
    expect(results.get('agility')).toEqual({
      grade: 'S',
      isSolved: true,
      sourceName: 'Golden Touch',
    })
    expect(results.get('divination')).toEqual({
      grade: 'B',
      isSolved: false,
      sourceName: 'Divine Druid',
    })
    expect(results.get('attack')).toEqual({
      grade: null,
      isSolved: false,
      sourceName: null,
    })
  })

  it('uses the best grade across guaranteed starting regions', () => {
    const regions = getRegions(['misthalin', 'havenhythe', 'karamja'])

    const results = calculateSkillResults([], regions)

    expect(results.get('cooking')).toEqual({
      grade: 'A',
      isSolved: true,
      sourceName: 'Misthalin',
    })
    expect(results.get('fishing')).toEqual({
      grade: 'A',
      isSolved: true,
      sourceName: 'Havenhythe',
    })
    expect(results.get('invention')).toEqual({
      grade: 'B',
      isSolved: false,
      sourceName: 'Misthalin',
    })
  })

  it('includes the revised optional-region grades', () => {
    const asgarniaResults = calculateSkillResults(
      [],
      getRegions(['asgarnia']),
    )
    const tirannwnResults = calculateSkillResults(
      [],
      getRegions(['tirannwn']),
    )
    const fremennikResults = calculateSkillResults(
      [],
      getRegions(['fremennik-providence']),
    )

    expect(asgarniaResults.get('slayer')).toMatchObject({
      grade: 'A',
      sourceName: 'Asgarnia',
    })
    expect(asgarniaResults.get('invention')).toMatchObject({
      grade: 'A',
      sourceName: 'Asgarnia',
    })
    expect(tirannwnResults.get('crafting')).toMatchObject({
      grade: 'B',
      sourceName: 'Tirannwn',
    })
    expect(fremennikResults.get('woodcutting')).toMatchObject({ grade: 'C' })
    expect(fremennikResults.get('firemaking')).toMatchObject({ grade: 'C' })
  })

  it('renders every skill with the guaranteed regions selected', () => {
    const markup = renderToStaticMarkup(
      <TooltipProvider>
        <SkillingSolver />
      </TooltipProvider>,
    )

    expect(markup).toContain('6 of 29 skills solved')
    expect(markup).toContain('Choose regions and relics')
    expect(markup).toContain('Misthalin &amp; Havenhythe')
    expect(markup).toContain('Region outline picker map')
    expect(markup).toContain('Click the map to add or remove a region')
    expect(markup).toContain('0 of 3')
    expect(markup).toContain('Tier 7')
    expect(markup).toContain('Unknown relic')
    expect(markup).toContain('Summoning')
    expect(markup).toContain('Divine Druid')
  })

  it('is registered for use in MDX pages', () => {
    expect(mdxComponents.SkillingSolver).toBeDefined()
  })
})
