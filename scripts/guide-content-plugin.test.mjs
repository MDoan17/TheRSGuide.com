import { describe, expect, it } from 'vitest'
import {
  buildGuideContent,
  documentPageMetadata,
  metadataHtml,
} from './guide-content-plugin.mjs'

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
      ogImage: '/og/getting-started-tick-system.png',
      ogImageAlt: 'The Tick System guide preview',
      socialSection: 'Getting Started',
    })
    expect(byRoute.get('/guides/skill-training')).toMatchObject({
      requiresPlayerData: true,
      hasTableOfContents: true,
    })
    expect(byRoute.get('/guides/early-game/desert-treasure')).toMatchObject({
      requiresPlayerData: true,
    })
  })

  it('precomputes optional article header visibility from frontmatter', async () => {
    const { documents } = await buildGuideContent(process.cwd())
    const byRoute = new Map(documents.map((document) => [document.path, document]))

    expect(byRoute.get('/leagues/map')).toMatchObject({
      title: 'Map',
      navigationTitle: 'Regions',
      hasTableOfContents: false,
      showPageHeader: false,
    })
    expect(byRoute.get('/leagues/map/anachronia')).toMatchObject({
      showPageHeader: true,
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

  it('renders complete social metadata for guide links', () => {
    const html = metadataHtml({
      path: '/guides/mid-game/invention',
      title: 'Invention | The RS Guide',
      description: 'The elite skill that enhances your gear with powerful perks',
      ogImage: '/og/guides-mid-game-invention.png',
      ogImageAlt: 'Invention guide preview',
      generatedOgImage: true,
      section: 'Mid Game',
      type: 'article',
      tags: ['RuneScape', 'Mid Game', 'Guide'],
    }, 'https://thersguide.com')

    expect(html).toContain('property="og:image:width" content="1200"')
    expect(html).toContain('property="og:image:alt" content="Invention guide preview"')
    expect(html).toContain('property="article:section" content="Mid Game"')
    expect(html).toContain('property="article:tag" content="RuneScape"')
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
  })

  it('treats the Leagues root as a website landing page', async () => {
    const { documents } = await buildGuideContent(process.cwd())
    const leagues = documents.find((document) => document.path === '/leagues')

    expect(documentPageMetadata(leagues)).toMatchObject({
      path: '/leagues',
      title: 'RuneScape Leagues Guide | The RS Guide',
      cardTitle: 'The Leagues Guide',
      type: 'website',
      section: 'The Leagues Guide',
    })
  })
})
