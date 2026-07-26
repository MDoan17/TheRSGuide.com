import { useEffect } from 'react'

const SITE_URL = 'https://thersguide.com'
const DEFAULT_OG_IMAGE = '/images/logos/thersguide.png'

export type PageMetadata = {
  path: string
  title: string
  description: string
  image?: string
  type?: 'website' | 'article'
}

const absoluteUrl = (value: string) => new URL(value, `${SITE_URL}/`).href

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
  type = 'website',
}: PageMetadata) {
  const canonical = absoluteUrl(path)
  const absoluteImage = absoluteUrl(image)

  document.title = title
  setCanonical(canonical)
  setMeta('meta[name="description"]', 'name', 'description', description)
  setMeta('meta[property="og:site_name"]', 'property', 'og:site_name', 'The RS Guide')
  setMeta('meta[property="og:type"]', 'property', 'og:type', type)
  setMeta('meta[property="og:title"]', 'property', 'og:title', title)
  setMeta('meta[property="og:description"]', 'property', 'og:description', description)
  setMeta('meta[property="og:url"]', 'property', 'og:url', canonical)
  setMeta('meta[property="og:image"]', 'property', 'og:image', absoluteImage)
  setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image')
  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', absoluteImage)
}

export function usePageMetadata(metadata: PageMetadata) {
  const {
    path,
    title,
    description,
    image = DEFAULT_OG_IMAGE,
    type = 'website',
  } = metadata

  useEffect(() => {
    applyPageMetadata({ path, title, description, image, type })
  }, [description, image, path, title, type])
}
