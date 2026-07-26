import { describe, expect, it } from 'vitest'
import { createGuideCatalog, type GuideDocumentSource } from './guide-catalog'
import { createGuideSearchIndex } from './guide-search'

const EmptyDocument = () => null
const document = (
  path: string,
  title: string,
  description: string,
): GuideDocumentSource => ({
  sourcePath: `../../content${path === '/setup' ? '/setup/index' : path}.mdx`,
  path,
  title,
  description,
  section: path.split('/')[1],
  tableOfContents: [],
  hasTableOfContents: false,
  requiresPlayerData: false,
  ogImage: '',
  Component: EmptyDocument,
})

const catalog = createGuideCatalog({
  documents: [
    document('/guides/tick-food', 'Food Guide', ''),
    document('/getting-started/tick-system', 'The Tick System', 'How RuneScape game ticks work.'),
    document('/guides/tick', 'Tick', 'A concise tick reference.'),
    document('/setup', 'Setup', 'Configure RuneScape.'),
  ],
  metadata: [
    { sourcePath: '../../content/getting-started/meta.json', pages: ['tick-system'] },
    { sourcePath: '../../content/guides/meta.json', pages: ['tick', 'tick-food'] },
  ],
  sections: [
    { id: 'setup', label: 'Setup' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'guides', label: 'Guides' },
  ],
})
const search = createGuideSearchIndex(catalog, {
  '/guides/tick-food': 'Learn about the tick system while eating.',
  '/getting-started/tick-system': 'Every action follows a 0.6 second cycle.',
  '/guides/tick': 'Timing reference.',
  '/setup': 'Client and interface setup.',
})

describe('GuideSearchIndex', () => {
  it('uses one deterministic relevance order', () => {
    expect(search.search('TICK').map(({ document, match }) => [
      document.title,
      match,
    ])).toEqual([
      ['Tick', 'title-exact'],
      ['The Tick System', 'title'],
      ['Food Guide', 'content'],
    ])
  })

  it('normalizes case, punctuation, accents, and repeated whitespace', () => {
    expect(search.search('  Tïck---System  ')[0]?.document.path).toBe(
      '/getting-started/tick-system',
    )
  })

  it('returns a readable excerpt for content matches', () => {
    const hit = search.search('eating')[0]

    expect(hit.document.title).toBe('Food Guide')
    expect(hit.excerpt).toContain('tick system while eating')
    expect(hit.sectionLabel).toBe('Guides')
  })

  it('browses in configured section and metadata order', () => {
    expect(search.browse().map(({ document }) => document.path)).toEqual([
      '/setup',
      '/getting-started/tick-system',
      '/guides/tick',
      '/guides/tick-food',
    ])
  })
})
