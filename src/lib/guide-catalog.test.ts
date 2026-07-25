import { describe, expect, it } from 'vitest'
import { createGuideCatalog, type GuideDocumentSource } from './guide-catalog'

const EmptyDocument = () => null

const document = (
  sourcePath: string,
  title: string,
  description = '',
  content = `${title} content`,
): GuideDocumentSource => ({
  sourcePath,
  body: `---\ntitle: "${title}"\ndescription: "${description}"\n---\n\n## ${content}`,
  Component: EmptyDocument,
})

const catalog = createGuideCatalog({
  documents: [
    document('../../content/guides/magic/basic-abilities.mdx', 'Magic Basic Abilities'),
    document('../../content/guides/melee/basic-abilities.mdx', 'Melee Basic Abilities'),
    document('../../content/guides/magic/index.mdx', 'Magic Abilities Guide'),
    document('../../content/guides/index.mdx', 'Guides'),
    document('../../content/guides/melee/index.mdx', 'Melee Abilities Guide'),
  ],
  metadata: [
    { sourcePath: '../../content/guides/meta.json', pages: ['index', 'melee', 'magic'] },
    { sourcePath: '../../content/guides/melee/meta.json', pages: ['index', 'basic-abilities'] },
    { sourcePath: '../../content/guides/magic/meta.json', pages: ['index', 'basic-abilities'] },
  ],
  sections: [{ id: 'guides', label: 'Guides' }],
})

describe('GuideCatalog', () => {
  it('owns deterministic depth-first navigation order and adjacency', () => {
    const section = catalog.section('guides')

    expect(section?.documents.map((item) => item.path)).toEqual([
      '/guides',
      '/guides/melee',
      '/guides/melee/basic-abilities',
      '/guides/magic',
      '/guides/magic/basic-abilities',
    ])
    expect(section?.navigation.map((node) => ({
      path: node.doc.path,
      children: node.children.map((child) => child.doc.path),
    }))).toEqual([
      { path: '/guides/melee', children: ['/guides/melee/basic-abilities'] },
      { path: '/guides/magic', children: ['/guides/magic/basic-abilities'] },
    ])

    expect(catalog.adjacent(catalog.get('/guides/melee')!)).toEqual({
      previous: catalog.get('/guides'),
      next: catalog.get('/guides/melee/basic-abilities'),
    })
  })

  it('owns breadcrumb labels and normalizes trailing slashes', () => {
    expect(catalog.get('/guides/melee/basic-abilities/')).toBe(
      catalog.get('/guides/melee/basic-abilities'),
    )
    expect(catalog.breadcrumbs('/guides/melee/basic-abilities')).toEqual([
      { path: '/guides', label: 'Guides', current: false },
      { path: '/guides/melee', label: 'Melee Abilities Guide', current: false },
      { path: '/guides/melee/basic-abilities', label: 'Melee Basic Abilities', current: true },
    ])
  })

  it('keeps raw MDX details behind normalized searchable text', () => {
    const guide = catalog.get('/guides/melee/basic-abilities')!
    const searchableText = catalog.searchableText(guide)

    expect(searchableText).toContain('Melee Basic Abilities content')
    expect(searchableText).not.toContain('title:')
    expect(searchableText).not.toContain('##')
  })

  it('precomputes the table of contents before a lazy guide component loads', () => {
    const guide = catalog.get('/guides/melee/basic-abilities')!

    expect(guide.hasTableOfContents).toBe(true)
    expect(guide.tableOfContents).toEqual([{
      id: 'melee-basic-abilities-content-0',
      text: 'Melee Basic Abilities content',
      level: 2,
    }])
  })

  it('allows component-driven pages to reserve a table-of-contents column', () => {
    const componentCatalog = createGuideCatalog({
      documents: [{
        sourcePath: '../../content/guides/skill-training.mdx',
        body: '---\ntitle: Skill Training\ntoc: true\n---\n\n<SkillTrainingLookup />',
        Component: EmptyDocument,
      }],
      metadata: [],
      sections: [{ id: 'guides', label: 'Guides' }],
    })

    expect(componentCatalog.get('/guides/skill-training')).toMatchObject({
      hasTableOfContents: true,
      tableOfContents: [],
    })
  })

  it('accepts CRLF frontmatter without exposing the source body', () => {
    const crlfCatalog = createGuideCatalog({
      documents: [{
        sourcePath: '../../content/setup/client.mdx',
        body: '---\r\ntitle: "Client Setup"\r\ndescription: "Install the client"\r\n---\r\nBody',
        Component: EmptyDocument,
      }],
      metadata: [],
      sections: [{ id: 'setup', label: 'Setup' }],
    })

    expect(crlfCatalog.get('/setup/client')).toMatchObject({
      title: 'Client Setup',
      description: 'Install the client',
    })
    expect(crlfCatalog.get('/setup/client')).not.toHaveProperty('body')
  })

  it('rejects duplicate route identities', () => {
    expect(() => createGuideCatalog({
      documents: [
        document('../../content/guides/duplicate.mdx', 'First'),
        document('C:\\copy\\content\\guides\\duplicate.mdx', 'Second'),
      ],
      metadata: [],
      sections: [{ id: 'guides', label: 'Guides' }],
    })).toThrow('Duplicate guide route: /guides/duplicate')
  })
})
