import type { ComponentType, LazyExoticComponent } from 'react'

export type Doc = {
  path: string
  title: string
  description: string
  section: string
  tableOfContents: readonly GuideTocItem[]
  hasTableOfContents: boolean
  Component: ComponentType | LazyExoticComponent<ComponentType>
}

export type GuideTocItem = {
  id: string
  text: string
  level: 2 | 3
}

export type GuideNavNode = {
  doc: Doc
  label: string
  children: GuideNavNode[]
}

export type GuideSection = {
  id: string
  label: string
  path: string
  index: Doc | null
  documents: readonly Doc[]
  navigation: readonly GuideNavNode[]
}

export type GuideBreadcrumb = {
  path: string
  label: string
  current: boolean
}

export type GuideAdjacent = {
  previous: Doc | null
  next: Doc | null
}

export type GuideDocumentSource = {
  sourcePath: string
  body: string
  Component: Doc['Component']
}

export type GuideMetadataSource = {
  sourcePath: string
  pages?: readonly string[]
}

export type GuideSectionDefinition = {
  id: string
  label: string
}

type GuideCatalogOptions = {
  documents: readonly GuideDocumentSource[]
  metadata: readonly GuideMetadataSource[]
  sections: readonly GuideSectionDefinition[]
}

const titleFromSlug = (value: string) =>
  value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const normalizeRoute = (path: string) => {
  if (path === '/') return path
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`
  return withLeadingSlash.replace(/\/+$/, '')
}

const routeFromDocumentSource = (sourcePath: string) => {
  const relative = sourcePath
    .replaceAll('\\', '/')
    .replace(/^.*\/content\//, '')
    .replace(/\.mdx$/, '')
  return normalizeRoute(`/${relative.replace(/\/index$/, '')}`)
}

const directoryFromMetadataSource = (sourcePath: string) => {
  const relative = sourcePath
    .replaceAll('\\', '/')
    .replace(/^.*\/content/, '')
    .replace(/\/meta\.json$/, '')
  return normalizeRoute(relative || '/')
}

const readFrontmatter = (body: string) => {
  const block = body.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  const field = (name: string) =>
    block.match(new RegExp(`^${name}:\\s*["']?(.*?)["']?\\s*$`, 'm'))?.[1] ?? ''
  const toc = field('toc').toLowerCase()
  return {
    title: field('title'),
    description: field('description'),
    toc: toc === 'true' ? true : toc === 'false' ? false : undefined,
  }
}

const headingText = (value: string) =>
  value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+#+\s*$/, '')
    .trim()

const headingId = (text: string, index: number) =>
  `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section'}-${index}`

const readTableOfContents = (body: string): GuideTocItem[] => {
  const items: GuideTocItem[] = []
  for (const line of body.replace(/^---[\s\S]*?---/, '').split(/\r?\n/)) {
    const match = /^(##|###)\s+(.+)$/.exec(line)
    if (!match) continue
    const text = headingText(match[2])
    if (!text) continue
    items.push({
      id: headingId(text, items.length),
      text,
      level: match[1].length as 2 | 3,
    })
  }
  return items
}

const normalizeSearchableText = (body: string) =>
  body
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>|\[\](){}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const groupLabel = (path: string) => {
  const slug = path.split('/').filter(Boolean).at(-1) ?? path
  return titleFromSlug(slug)
}

const parentPath = (path: string) => path.slice(0, path.lastIndexOf('/')) || '/'

export class GuideCatalog {
  readonly documents: readonly Doc[]
  readonly sections: readonly GuideSection[]

  readonly #documentsByPath: ReadonlyMap<string, Doc>
  readonly #sectionsById: ReadonlyMap<string, GuideSection>
  readonly #searchableTextByPath: ReadonlyMap<string, string>

  constructor(options: GuideCatalogOptions) {
    const orderByPath = new Map<string, number>()
    for (const metadata of options.metadata) {
      const directory = directoryFromMetadataSource(metadata.sourcePath)
      metadata.pages?.forEach((page, index) => {
        if (page === 'index') return
        const path = normalizeRoute(`${directory === '/' ? '' : directory}/${page}`)
        orderByPath.set(path, index)
      })
    }

    const searchableTextByPath = new Map<string, string>()
    const documents = options.documents.map((source) => {
      const path = routeFromDocumentSource(source.sourcePath)
      const parts = path.split('/').filter(Boolean)
      const fallback = parts.at(-1) ?? 'The RS Guide'
      const frontmatter = readFrontmatter(source.body)
      const tableOfContents = readTableOfContents(source.body)
      searchableTextByPath.set(path, normalizeSearchableText(source.body))
      return {
        path,
        title: frontmatter.title || titleFromSlug(fallback),
        description: frontmatter.description,
        section: parts[0] ?? '',
        tableOfContents,
        hasTableOfContents: frontmatter.toc ?? tableOfContents.length > 0,
        Component: source.Component,
      } satisfies Doc
    })

    const documentsByPath = new Map<string, Doc>()
    for (const document of documents) {
      if (documentsByPath.has(document.path)) {
        throw new Error(`Duplicate guide route: ${document.path}`)
      }
      documentsByPath.set(document.path, document)
    }

    const compareDocuments = (a: Doc, b: Doc) => {
      if (a.path === b.path) return 0
      if (b.path.startsWith(`${a.path}/`)) return -1
      if (a.path.startsWith(`${b.path}/`)) return 1

      const aParts = a.path.split('/').filter(Boolean)
      const bParts = b.path.split('/').filter(Boolean)
      const length = Math.max(aParts.length, bParts.length)
      for (let index = 1; index <= length; index += 1) {
        const aPrefix = `/${aParts.slice(0, index).join('/')}`
        const bPrefix = `/${bParts.slice(0, index).join('/')}`
        if (aPrefix === bPrefix) continue
        const difference = (orderByPath.get(aPrefix) ?? Number.MAX_SAFE_INTEGER)
          - (orderByPath.get(bPrefix) ?? Number.MAX_SAFE_INTEGER)
        if (difference) return difference
        return aPrefix.localeCompare(bPrefix)
      }
      return a.title.localeCompare(b.title)
    }

    const sections = options.sections.map((definition) => {
      const path = `/${definition.id}`
      const sectionDocuments = documents
        .filter((document) => document.section === definition.id)
        .sort(compareDocuments)
      const navigationDocuments = sectionDocuments.filter((document) => document.path !== path)
      const nodes: GuideNavNode[] = navigationDocuments.map((doc) => ({
        doc,
        label: groupLabel(doc.path),
        children: [],
      }))
      const nodesByPath = new Map(nodes.map((node) => [node.doc.path, node]))
      const navigation: GuideNavNode[] = []

      for (const node of nodes) {
        const parent = nodesByPath.get(parentPath(node.doc.path))
        if (parent) parent.children.push(node)
        else navigation.push(node)
      }

      return {
        id: definition.id,
        label: definition.label,
        path,
        index: documentsByPath.get(path) ?? null,
        documents: sectionDocuments,
        navigation,
      } satisfies GuideSection
    })

    const configuredSections = new Set(sections.map((section) => section.id))
    this.documents = [
      ...sections.flatMap((section) => section.documents),
      ...documents
        .filter((document) => !configuredSections.has(document.section))
        .sort((a, b) => a.path.localeCompare(b.path)),
    ]
    this.sections = sections
    this.#documentsByPath = documentsByPath
    this.#sectionsById = new Map(sections.map((section) => [section.id, section]))
    this.#searchableTextByPath = searchableTextByPath
  }

  get(path: string) {
    return this.#documentsByPath.get(normalizeRoute(path))
  }

  section(id: string) {
    return this.#sectionsById.get(id)
  }

  sectionLabel(id: string) {
    return this.section(id)?.label ?? titleFromSlug(id)
  }

  searchableText(document: Doc) {
    return this.#searchableTextByPath.get(document.path) ?? ''
  }

  breadcrumbs(path: string): GuideBreadcrumb[] {
    const normalizedPath = normalizeRoute(path)
    const parts = normalizedPath.split('/').filter(Boolean)
    return parts.map((part, index) => {
      const breadcrumbPath = `/${parts.slice(0, index + 1).join('/')}`
      return {
        path: breadcrumbPath,
        label: this.get(breadcrumbPath)?.title
          ?? (index === 0 ? this.section(part)?.label : undefined)
          ?? titleFromSlug(part),
        current: index === parts.length - 1,
      }
    })
  }

  adjacent(document: Doc): GuideAdjacent {
    const documents = this.section(document.section)?.documents ?? []
    const index = documents.findIndex((candidate) => candidate.path === document.path)
    return {
      previous: index > 0 ? documents[index - 1] : null,
      next: index >= 0 && index < documents.length - 1 ? documents[index + 1] : null,
    }
  }
}

export const createGuideCatalog = (options: GuideCatalogOptions) => new GuideCatalog(options)
