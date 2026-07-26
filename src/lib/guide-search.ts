import type { Doc, GuideCatalog } from '@/lib/guide-catalog'

export type GuideSearchMatch = 'title-exact' | 'title-prefix' | 'title' | 'description' | 'content'

export type GuideSearchHit = {
  document: Doc
  sectionLabel: string
  excerpt: string
  match: GuideSearchMatch
}

export type GuideSearchCorpus = Readonly<Record<string, string>>

type SearchEntry = {
  document: Doc
  sectionLabel: string
  title: string
  description: string
  content: string
  displayContent: string
  order: number
}

const normalizeSearchValue = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const matchRank = (entry: SearchEntry, query: string): number => {
  if (entry.title === query) return 0
  if (entry.title.startsWith(query)) return 1
  if (entry.title.includes(query)) return 2
  if (entry.description.includes(query)) return 3
  if (entry.content.includes(query)) return 4
  return -1
}

const matchName = (rank: number): GuideSearchMatch =>
  ['title-exact', 'title-prefix', 'title', 'description', 'content'][rank] as GuideSearchMatch

const excerptFor = (entry: SearchEntry, query: string) => {
  if (entry.description.includes(query) && entry.document.description) {
    return entry.document.description
  }

  const match = entry.displayContent.toLowerCase().indexOf(query)
  if (match < 0) {
    return entry.document.description || `Match found in the ${entry.document.title} topic.`
  }

  const start = Math.max(0, match - 48)
  const end = Math.min(entry.displayContent.length, match + query.length + 86)
  return `${start > 0 ? '…' : ''}${entry.displayContent.slice(start, end).trim()}${end < entry.displayContent.length ? '…' : ''}`
}

export class GuideSearchIndex {
  readonly #entries: readonly SearchEntry[]

  constructor(catalog: GuideCatalog, corpus: GuideSearchCorpus = {}) {
    this.#entries = catalog.documents.map((document, order) => {
      const displayContent = (corpus[document.path] ?? '').replace(/\s+/g, ' ').trim()
      return {
        document,
        sectionLabel: catalog.sectionLabel(document.section),
        title: normalizeSearchValue(document.title),
        description: normalizeSearchValue(document.description),
        content: normalizeSearchValue(displayContent),
        displayContent,
        order,
      }
    })
  }

  browse(limit = 14): GuideSearchHit[] {
    return this.#entries.slice(0, limit).map((entry) => ({
      document: entry.document,
      sectionLabel: entry.sectionLabel,
      excerpt: entry.document.description || `Browse the ${entry.sectionLabel} section.`,
      match: 'title',
    }))
  }

  search(query: string, limit = 30): GuideSearchHit[] {
    const normalizedQuery = normalizeSearchValue(query)
    if (!normalizedQuery) return []

    return this.#entries
      .map((entry) => ({ entry, rank: matchRank(entry, normalizedQuery) }))
      .filter(({ rank }) => rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.entry.order - b.entry.order)
      .slice(0, limit)
      .map(({ entry, rank }) => ({
        document: entry.document,
        sectionLabel: entry.sectionLabel,
        excerpt: excerptFor(entry, normalizedQuery),
        match: matchName(rank),
      }))
  }
}

export const createGuideSearchIndex = (
  catalog: GuideCatalog,
  corpus?: GuideSearchCorpus,
) => new GuideSearchIndex(catalog, corpus)
