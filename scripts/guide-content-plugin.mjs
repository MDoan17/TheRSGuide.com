import { promises as fs } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const MANIFEST_ID = 'virtual:guide-manifest'
const SEARCH_ID = 'virtual:guide-search-corpus'
const RESOLVED_MANIFEST_ID = `\0${MANIFEST_ID}`
const RESOLVED_SEARCH_ID = `\0${SEARCH_ID}`
const DEFAULT_SITE_URL = 'https://thersguide.com'
const DEFAULT_OG_IMAGE = '/images/logos/thersguide.png'
const PLAYER_DATA_COMPONENTS = [
  'PlayerSearch',
  'QuestRequirements',
  'SkillTrainingLookup',
  'EfficiencyGuideTool',
]

const normalizeSlashes = (value) => value.replaceAll('\\', '/')

const titleFromSlug = (value) =>
  value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const normalizeRoute = (route) => {
  const withLeadingSlash = route.startsWith('/') ? route : `/${route}`
  return withLeadingSlash === '/' ? '/' : withLeadingSlash.replace(/\/+$/, '')
}

const routeFromRelativeFile = (relativeFile) =>
  normalizeRoute(`/${normalizeSlashes(relativeFile).replace(/\.mdx$/, '').replace(/\/index$/, '')}`)

const headingText = (value) =>
  value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+#+\s*$/, '')
    .trim()

const headingId = (text, index) =>
  `${text.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section'}-${index}`

const tableOfContents = (body) => {
  const items = []
  for (const line of body.split(/\r?\n/)) {
    const match = /^(##|###)\s+(.+)$/.exec(line)
    if (!match) continue
    const text = headingText(match[2])
    if (!text) continue
    items.push({
      id: headingId(text, items.length),
      text,
      level: match[1].length,
    })
  }
  return items
}

const searchableText = (body) =>
  body
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`>|[\](){}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const requiresPlayerData = (body, override) => {
  if (typeof override === 'boolean') return override
  return PLAYER_DATA_COMPONENTS.some((component) =>
    new RegExp(`<${component}(?:\\s|/|>)`).test(body)
  )
}

const walk = async (directory, filename) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) return walk(absolute, filename)
    return entry.isFile() && (!filename || entry.name === filename) ? [absolute] : []
  }))
  return nested.flat()
}

export async function buildGuideContent(root) {
  const contentDirectory = path.join(root, 'content')
  const mdxFiles = (await walk(contentDirectory))
    .filter((file) => file.endsWith('.mdx'))
    .sort()
  const metaFiles = (await walk(contentDirectory, 'meta.json')).sort()

  const documents = await Promise.all(mdxFiles.map(async (absoluteFile) => {
    const relativeFile = normalizeSlashes(path.relative(contentDirectory, absoluteFile))
    const sourcePath = `../../content/${relativeFile}`
    const raw = await fs.readFile(absoluteFile, 'utf8')
    const parsed = matter(raw)
    const route = routeFromRelativeFile(relativeFile)
    const parts = route.split('/').filter(Boolean)
    const fallback = parts.at(-1) ?? 'The RS Guide'
    const toc = tableOfContents(parsed.content)
    const tocOverride = typeof parsed.data.toc === 'boolean' ? parsed.data.toc : undefined

    return {
      sourcePath,
      path: route,
      title: typeof parsed.data.title === 'string' && parsed.data.title.trim()
        ? parsed.data.title.trim()
        : titleFromSlug(fallback),
      description: typeof parsed.data.description === 'string'
        ? parsed.data.description.trim()
        : '',
      section: parts[0] ?? '',
      tableOfContents: toc,
      hasTableOfContents: tocOverride ?? toc.length > 0,
      requiresPlayerData: requiresPlayerData(parsed.content, parsed.data.playerData),
      ogImage: typeof parsed.data.ogImage === 'string'
        ? parsed.data.ogImage
        : typeof parsed.data.image === 'string'
          ? parsed.data.image
          : '',
      searchText: searchableText(parsed.content),
    }
  }))

  const documentRoutes = new Set()
  for (const document of documents) {
    if (documentRoutes.has(document.path)) {
      throw new Error(`Duplicate guide route: ${document.path}`)
    }
    documentRoutes.add(document.path)
  }

  const metadata = await Promise.all(metaFiles.map(async (absoluteFile) => {
    const relativeFile = normalizeSlashes(path.relative(root, absoluteFile))
    const parsed = JSON.parse(await fs.readFile(absoluteFile, 'utf8'))
    const pages = Array.isArray(parsed.pages)
      ? parsed.pages.filter((page) => typeof page === 'string')
      : []
    const relativeDirectory = normalizeSlashes(
      path.relative(contentDirectory, path.dirname(absoluteFile)),
    )
    const baseRoute = normalizeRoute(`/${relativeDirectory}`)

    for (const page of pages) {
      const pageRoute = page === 'index'
        ? baseRoute
        : normalizeRoute(`${baseRoute}/${page}`)
      if (!documentRoutes.has(pageRoute)) {
        throw new Error(
          `${relativeFile} references "${page}", but ${pageRoute} has no MDX document`,
        )
      }
    }

    return {
      sourcePath: `../../${relativeFile}`,
      pages,
    }
  }))

  return { documents, metadata }
}

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

const absoluteUrl = (value, siteUrl) => new URL(value, `${siteUrl}/`).href

const metadataHtml = (metadata, siteUrl) => {
  const title = escapeHtml(metadata.title)
  const description = escapeHtml(metadata.description)
  const canonical = escapeHtml(absoluteUrl(metadata.path, siteUrl))
  const image = escapeHtml(absoluteUrl(metadata.ogImage || DEFAULT_OG_IMAGE, siteUrl))
  const type = metadata.type || 'website'

  return `<!-- page-metadata:start -->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:site_name" content="The RS Guide" />
    <meta property="og:type" content="${escapeHtml(type)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <!-- page-metadata:end -->`
}

const replaceMetadata = (html, metadata, siteUrl) => {
  const replacement = metadataHtml(metadata, siteUrl)
  const marker = /<!-- page-metadata:start -->[\s\S]*?<!-- page-metadata:end -->/
  return marker.test(html)
    ? html.replace(marker, replacement)
    : html.replace('</head>', `${replacement}\n  </head>`)
}

export function guideContentPlugin({ siteUrl = DEFAULT_SITE_URL } = {}) {
  let root = process.cwd()
  let outputDirectory = path.join(root, 'dist')

  return {
    name: 'guide-content',
    enforce: 'pre',
    configResolved(config) {
      root = config.root
      outputDirectory = path.resolve(root, config.build.outDir)
    },
    resolveId(id) {
      if (id === MANIFEST_ID) return RESOLVED_MANIFEST_ID
      if (id === SEARCH_ID) return RESOLVED_SEARCH_ID
      return null
    },
    async load(id) {
      if (id !== RESOLVED_MANIFEST_ID && id !== RESOLVED_SEARCH_ID) return null
      const { documents, metadata } = await buildGuideContent(root)
      if (id === RESOLVED_SEARCH_ID) {
        const corpus = Object.fromEntries(documents.map((document) => [
          document.path,
          document.searchText,
        ]))
        return `export const guideSearchCorpus = ${JSON.stringify(corpus)}`
      }
      const manifest = documents.map((document) =>
        Object.fromEntries(Object.entries(document).filter(([key]) => key !== 'searchText'))
      )
      return `export const guideManifest = ${JSON.stringify(manifest)}
export const guideMetadata = ${JSON.stringify(metadata)}`
    },
    async closeBundle() {
      const indexPath = path.join(outputDirectory, 'index.html')
      try {
        const baseHtml = await fs.readFile(indexPath, 'utf8')
        const { documents } = await buildGuideContent(root)
        const pages = [
          ...documents.map((document) => ({
            path: document.path,
            title: `${document.title} | The RS Guide`,
            description: document.description || `Read ${document.title} on The RS Guide.`,
            ogImage: document.ogImage,
            type: 'article',
          })),
          {
            path: '/extras/player',
            title: 'Player Progression | The RS Guide',
            description: 'Compare a RuneScape profile with early, mid, and late game progression recommendations.',
            ogImage: '',
            type: 'website',
          },
        ]

        await Promise.all(pages.map(async (page) => {
          const routeDirectory = path.join(outputDirectory, ...page.path.split('/').filter(Boolean))
          await fs.mkdir(routeDirectory, { recursive: true })
          await fs.writeFile(
            path.join(routeDirectory, 'index.html'),
            replaceMetadata(baseHtml, page, siteUrl),
          )
        }))
      } catch (error) {
        this.error(`Unable to generate route metadata: ${error instanceof Error ? error.message : error}`)
      }
    },
  }
}
