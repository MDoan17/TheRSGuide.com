import { describe, expect, it } from 'vitest'
import { createGuideCatalog, type GuideDocumentSource } from './guide-catalog'
import { createGuideSearchIndex } from './guide-search'

const EmptyDocument = () => null
const document = (
  sourcePath: string,
  title: string,
  description: string,
  body: string,
): GuideDocumentSource => ({
  sourcePath,
  body: `---\ntitle: "${title}"\ndescription: "${description}"\n---\n${body}`,
  Component: EmptyDocument,
})

const catalog = createGuideCatalog({
  documents: [
    document('../../content/guides/tick-food.mdx', 'Food Guide', '', 'Learn about the tick system while eating.'),
    document('../../content/getting-started/tick-system.mdx', 'The Tick System', 'How RuneScape game ticks work.', 'Every action follows a 0.6 second cycle.'),
    document('../../content/guides/tick.mdx', 'Tick', 'A concise tick reference.', 'Timing reference.'),
    document('../../content/setup/index.mdx', 'Setup', 'Configure RuneScape.', 'Client and interface setup.'),
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
const search = createGuideSearchIndex(catalog)

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
