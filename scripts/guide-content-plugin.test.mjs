import { describe, expect, it } from 'vitest'
import { buildGuideContent } from './guide-content-plugin.mjs'

describe('guide content build manifest', () => {
  it('builds a unique, fully described guide manifest', async () => {
    const { documents } = await buildGuideContent(process.cwd())
    const routes = documents.map((document) => document.path)

    expect(documents.length).toBeGreaterThan(0)
    expect(new Set(routes)).toHaveLength(routes.length)
    expect(documents.every((document) => document.description.length > 0)).toBe(true)
  })

  it('precomputes route layout and player-data requirements', async () => {
    const { documents } = await buildGuideContent(process.cwd())
    const byRoute = new Map(documents.map((document) => [document.path, document]))

    expect(byRoute.get('/getting-started/tick-system')).toMatchObject({
      title: 'The Tick System',
      requiresPlayerData: false,
      hasTableOfContents: true,
    })
    expect(byRoute.get('/guides/skill-training')).toMatchObject({
      requiresPlayerData: true,
      hasTableOfContents: true,
    })
    expect(byRoute.get('/guides/early-game/desert-treasure')).toMatchObject({
      requiresPlayerData: true,
    })
  })

  it('extracts full text for the separately loaded search corpus', async () => {
    const { documents } = await buildGuideContent(process.cwd())
    const tickSystem = documents.find(
      (document) => document.path === '/getting-started/tick-system',
    )

    expect(tickSystem?.searchText).toContain('0.6')
    expect(tickSystem?.tableOfContents.length).toBeGreaterThan(0)
  })
})
