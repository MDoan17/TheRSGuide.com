/// <reference types="vite/client" />

declare module 'virtual:guide-manifest' {
  import type { GuideMetadataSource, GuideTocItem } from '@/lib/guide-catalog'

  export const guideManifest: readonly {
    sourcePath: string
    path: string
    title: string
    description: string
    section: string
    tableOfContents: readonly GuideTocItem[]
    hasTableOfContents: boolean
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
  export const frontmatter: { title?: string; description?: string }
  const Component: ComponentType
  export default Component
}
