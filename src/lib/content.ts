import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type MdxModule = {
  default: ComponentType
  frontmatter?: { title?: string; description?: string }
}

export type Doc = {
  path: string
  sourcePath: string
  title: string
  description: string
  section: string
  body: string
  Component: ComponentType | LazyExoticComponent<ComponentType>
}

const modules = import.meta.glob<MdxModule>('../../content/**/*.mdx')
type RawImport = string | { default?: unknown }

const rawFiles = import.meta.glob('../../content/**/*.mdx', { eager: true, query: '?raw', import: 'default' }) as Record<string, RawImport>

const normalizeRawImport = (value: RawImport | undefined): string => {
  if (typeof value === 'string') return value
  if (value && typeof value.default === 'string') return value.default
  return ''
}

const titleFromSlug = (value: string) =>
  value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const routeFromFile = (file: string) => {
  const relative = file.replace('../../content/', '').replace(/\.mdx$/, '')
  return `/${relative.replace(/\/index$/, '')}`
}

const readFrontmatter = (body: string) => {
  const block = body.match(/^---\s*\n([\s\S]*?)\n---/)?.[1] ?? ''
  const field = (name: string) => block.match(new RegExp(`^${name}:\\s*["']?(.*?)["']?\\s*$`, 'm'))?.[1] ?? ''
  return { title: field('title'), description: field('description') }
}

export const docs: Doc[] = Object.entries(modules).map(([sourcePath, loader]) => {
  const path = routeFromFile(sourcePath)
  const parts = path.split('/').filter(Boolean)
  const fallback = parts.at(-1) ?? 'The RS Guide'
  const body = normalizeRawImport(rawFiles[sourcePath])
  const frontmatter = readFrontmatter(body)
  return {
    path,
    sourcePath,
    title: frontmatter.title || titleFromSlug(fallback),
    description: frontmatter.description,
    section: parts[0] ?? '',
    body,
    Component: lazy(loader),
  }
})

const metaFiles = import.meta.glob<{ pages?: string[] }>('../../content/**/meta.json', { eager: true, import: 'default' })
const order = new Map<string, number>()
Object.entries(metaFiles).forEach(([file, meta]) => {
  const directory = file.replace('../../content', '').replace(/\/meta\.json$/, '')
  meta.pages?.forEach((page, index) => {
    if (page === 'index') return
    const path = `${directory}/${page}`.replace(/\/index$/, '') || '/'
    order.set(path, index)
  })
})

export const sectionLabels: Record<string, string> = {
  setup: 'Setup',
  'getting-started': 'Getting Started',
  guides: 'Guides',
  extras: 'Extras',
}

export const sectionOrder = ['setup', 'getting-started', 'guides', 'extras']

export const docsBySection = Object.fromEntries(sectionOrder.map((section) => [
  section,
  docs.filter((doc) => doc.section === section).sort((a, b) => {
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
      const difference = (order.get(aPrefix) ?? 999) - (order.get(bPrefix) ?? 999)
      if (difference) return difference
      return aPrefix.localeCompare(bPrefix)
    }
    return a.title.localeCompare(b.title)
  }),
])) as Record<string, Doc[]>

export const getDoc = (path: string) => docs.find((doc) => doc.path === path.replace(/\/$/, '') || (path === '/' && doc.path === '/'))

export const searchableText = (doc: Doc) => doc.body
  .replace(/^---[\s\S]*?---/, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/[#*_`>|\[\](){}]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
