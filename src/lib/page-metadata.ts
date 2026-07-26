import { useEffect } from 'react'

const SITE_URL = 'https://thersguide.com'
const DEFAULT_OG_IMAGE = '/og/home.png'
const OPEN_GRAPH_IMAGE_WIDTH = '1200'
const OPEN_GRAPH_IMAGE_HEIGHT = '630'

export const openGraphImagePath = (route: string) => {
  const slug = route.split('/').filter(Boolean).join('-') || 'home'
  return `/og/${slug}.png`
}

export type PageMetadata = {
  path: string
  title: string
  description: string
  image?: string
  imageAlt?: string
  type?: 'website' | 'article'
  section?: string
  tags?: readonly string[]
}

const absoluteUrl = (value: string) => new URL(value, `${SITE_URL}/`).href
const absoluteImageUrl = (value: string) => new URL(value, window.location.origin).href

const setMeta = (
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

const removeMeta = (selector: string) => {
  document.head.querySelectorAll(selector).forEach((element) => element.remove())
}

const setMetaList = (
  selector: string,
  property: string,
  values: readonly string[],
) => {
  removeMeta(selector)
  for (const value of values) {
    const element = document.createElement('meta')
    element.setAttribute('property', property)
    element.content = value
    document.head.append(element)
  }
}

const setCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.rel = 'canonical'
    document.head.append(element)
  }
  element.href = href
}

export function applyPageMetadata({
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  imageAlt = `${title} preview`,
  type = 'website',
  section,
  tags = [],
}: PageMetadata) {
  const canonical = absoluteUrl(path)
  const absoluteImage = absoluteImageUrl(image)

  document.title = title
  setCanonical(canonical)
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[name="author"]', 'name', 'author', 'The RS Guide')
  setMeta(
    'meta[name="robots"]',
    'name',
    'robots',
    'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  )
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'The RS Guide')
  setMeta('meta[property="og:locale"]', 'property', 'og:locale', 'en_US')
  setMeta('meta[property="og:type"]', 'property', 'og:type', type)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
  setMeta('meta[property="og:image"]', 'property', 'og:image', absoluteImage)
  setMeta('meta[property="og:image:secure_url"]', 'property', 'og:image:secure_url', absoluteImage)
  setMeta('meta[property="og:image:type"]', 'property', 'og:image:type', 'image/png')
  setMeta('meta[property="og:image:width"]', 'property', 'og:image:width', OPEN_GRAPH_IMAGE_WIDTH)
  setMeta('meta[property="og:image:height"]', 'property', 'og:image:height', OPEN_GRAPH_IMAGE_HEIGHT)
  setMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', imageAlt)
  if (type === 'article') {
    setMeta(
      'meta[property="article:section"]',
      'property',
      'article:section',
      section || 'RuneScape Guides',
    )
    setMetaList('meta[property="article:tag"]', 'article:tag', tags)
  } else {
    removeMeta('meta[property="article:section"], meta[property="article:tag"]')
  }
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setMeta('meta[name="twitter:domain"]', 'name', 'twitter:domain', 'thersguide.com')
  setMeta('meta[name="twitter:url"]', 'name', 'twitter:url', canonical)
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteImage)
  setMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', imageAlt)
}

export function usePageMetadata(metadata: PageMetadata) {
  const {
    path,
    title,
    description,
    image = DEFAULT_OG_IMAGE,
    imageAlt = `${title} preview`,
    type = 'website',
    section,
    tags = [],
  } = metadata
  const tagsKey = tags.join('|')

  useEffect(() => {
    const normalizedTags = tagsKey ? tagsKey.split('|') : []
    applyPageMetadata({
      path,
      title,
      description,
      image,
      imageAlt,
      type,
      section,
      tags: normalizedTags,
    })
  }, [description, image, imageAlt, path, section, tagsKey, title, type])
}
