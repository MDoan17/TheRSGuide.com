/// <reference types="vite/client" />

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: { title?: string; description?: string }
  const Component: ComponentType
  export default Component
}
