/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEPLOYMENT_ROLE?: 'primary' | 'failover'
  readonly VITE_HOMEPAGE_MODE?: string
  readonly VITE_LEAGUES_START_DATE?: string
  readonly VITE_LEAGUES_END_DATE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:guide-manifest' {
  import type { GuideMetadataSource, GuideTocItem } from '@/lib/guide-catalog'

  export const guideManifest: readonly {
    sourcePath: string
    path: string
    title: string
    navigationTitle: string
    description: string
    section: string
    tableOfContents: readonly GuideTocItem[]
    hasTableOfContents: boolean
    showPageHeader: boolean
    requiresPlayerData: boolean
    ogImage: string
  }[]
  export const guideMetadata: readonly GuideMetadataSource[]
}

declare module 'virtual:guide-search-corpus' {
  import type { GuideSearchCorpus } from '@/lib/guide-search'
  export const guideSearchCorpus: GuideSearchCorpus
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: {
    title?: string
    navigationTitle?: string
    description?: string
    toc?: boolean
    header?: boolean
  }
  const Component: ComponentType
  export default Component
}
