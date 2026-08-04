import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import relicData from '@/data/leagues-ii/relics.json'
import {
  calculateSkillResults,
  SkillingSolver,
  type Relic,
} from '@/components/mdx/skilling-solver'
import { mdxComponents } from '@/mdx_components/mdx-components'

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

  it('renders every skill with an empty initial state', () => {
    const markup = renderToStaticMarkup(<SkillingSolver />)

    expect(markup).toContain('0 of 29 skills solved')
    expect(markup).toContain('Choose your relics')
    expect(markup).toContain('Tier 7')
    expect(markup).toContain('Unknown relic')
    expect(markup).toContain('Summoning')
    expect(markup).toContain('Divine Druid')
  })

  it('is registered for use in MDX pages', () => {
    expect(mdxComponents.SkillingSolver).toBeDefined()
  })
})
