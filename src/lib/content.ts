import { lazy, type ComponentType } from 'react'
import {
  createGuideCatalog,
  type GuideDocumentSource,
  type GuideMetadataSource,
} from '@/lib/guide-catalog'
import { createGuideSearchIndex } from '@/lib/guide-search'

type MdxModule = {
  default: ComponentType
  frontmatter?: { title?: string; description?: string }
}

const modules = import.meta.glob<MdxModule>('../../content/**/*.mdx')
type RawImport = string | { default?: unknown }

const rawFiles = import.meta.glob('../../content/**/*.mdx', { eager: true, query: '?raw', import: 'default' }) as Record<string, RawImport>

const normalizeRawImport = (value: RawImport | undefined): string => {
  if (typeof value === 'string') return value
  if (value && typeof value.default === 'string') return value.default
  return ''
}

const metaFiles = import.meta.glob<{ pages?: string[] }>('../../content/**/meta.json', { eager: true, import: 'default' })

const documentSources: GuideDocumentSource[] = Object.entries(modules).map(([sourcePath, loader]) => ({
  sourcePath,
  body: normalizeRawImport(rawFiles[sourcePath]),
  Component: lazy(loader),
}))

const metadataSources: GuideMetadataSource[] = Object.entries(metaFiles).map(([sourcePath, metadata]) => ({
  sourcePath,
  pages: metadata.pages,
}))

export const guideCatalog = createGuideCatalog({
  documents: documentSources,
  metadata: metadataSources,
  sections: [
    { id: 'setup', label: 'Setup' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'guides', label: 'Guides' },
    { id: 'extras', label: 'Extras' },
  ],
})

export const guideSearch = createGuideSearchIndex(guideCatalog)

export type {
  Doc,
  GuideAdjacent,
  GuideBreadcrumb,
  GuideNavNode,
  GuideSection,
  GuideTocItem,
} from '@/lib/guide-catalog'
