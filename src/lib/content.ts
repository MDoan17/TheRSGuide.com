import { lazy, type ComponentType } from 'react'
import { guideManifest, guideMetadata } from 'virtual:guide-manifest'
import {
  createGuideCatalog,
  type GuideDocumentSource,
} from '@/lib/guide-catalog'
import { createGuideSearchIndex } from '@/lib/guide-search'
import { resolveHomepageMode } from '@/lib/homepage-mode'

type MdxModule = {
  default: ComponentType
  frontmatter?: { title?: string; navigationTitle?: string; description?: string }
}

const modules = import.meta.glob<MdxModule>('../../content/**/*.mdx')

const documentSources: GuideDocumentSource[] = guideManifest.map((document) => {
  const loader = modules[document.sourcePath]
  if (!loader) throw new Error(`Missing MDX module for ${document.sourcePath}`)
  return {
    ...document,
    Component: lazy(loader),
  }
})

export const guideCatalog = createGuideCatalog({
  documents: documentSources,
  metadata: guideMetadata,
  sections: [
    { id: 'setup', label: 'Setup' },
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'guides', label: 'Guides' },
    { id: 'extras', label: 'Extras' },
    { id: 'leagues', label: 'Leagues' },
  ],
})

export type PrimaryNavigationLink = {
  id: string
  label: string
  path: string
}

const evergreenGuideSections = guideCatalog.sections.filter((section) => section.id !== 'leagues')
const leaguesGuideSections = guideCatalog.sections.filter((section) => section.id === 'leagues')
const evergreenPrimaryNavigation: readonly PrimaryNavigationLink[] = guideCatalog.sections
  .filter((section) => section.id !== 'leagues')
  .map((section) => ({
    id: section.id,
    label: section.label,
    path: section.path,
  }))
const leaguesModeEvergreenPrimaryNavigation: readonly PrimaryNavigationLink[] =
  guideCatalog.sections.map((section) => ({
    id: section.id,
    label: section.label,
    path: section.path,
  }))
const leaguesPrimaryNavigation: readonly PrimaryNavigationLink[] =
  guideCatalog.section('leagues')?.navigation.map((node) => ({
    id: node.doc.path,
    label: node.label,
    path: node.doc.path,
  })) ?? []

export const isLeaguesRoute = (pathname: string) => {
  const normalizedPathname = pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  return normalizedPathname === '/leagues' || normalizedPathname.startsWith('/leagues/')
}

export const guideSectionsForPath = (pathname: string) =>
  isLeaguesRoute(pathname) ? leaguesGuideSections : evergreenGuideSections

export const primaryNavigationForPath = (
  pathname: string,
  homepageMode = import.meta.env.VITE_HOMEPAGE_MODE,
) => {
  if (isLeaguesRoute(pathname)) return leaguesPrimaryNavigation
  return resolveHomepageMode(homepageMode) === 'leagues'
    ? leaguesModeEvergreenPrimaryNavigation
    : evergreenPrimaryNavigation
}

export const guideSearch = createGuideSearchIndex(guideCatalog)

let fullGuideSearch: ReturnType<typeof createGuideSearchIndex> | null = null
let guideSearchPromise: Promise<ReturnType<typeof createGuideSearchIndex>> | null = null

export const loadGuideSearch = () => {
  if (fullGuideSearch) return Promise.resolve(fullGuideSearch)
  guideSearchPromise ??= import('virtual:guide-search-corpus').then(({ guideSearchCorpus }) => {
    fullGuideSearch = createGuideSearchIndex(guideCatalog, guideSearchCorpus)
    return fullGuideSearch
  })
  return guideSearchPromise
}

export type {
  Doc,
  GuideAdjacent,
  GuideBreadcrumb,
  GuideNavNode,
  GuideSection,
  GuideTocItem,
} from '@/lib/guide-catalog'
