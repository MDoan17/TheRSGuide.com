const DEFAULT_ORIGIN = 'https://thersguide.com'
const VALID_HOST = /^[a-z0-9.-]+(?::\d+)?$/i

const firstHeaderValue = (value) => {
  const header = Array.isArray(value) ? value[0] : value
  return header?.split(',')[0]?.trim() ?? ''
}

export const requestOrigin = (headers, encrypted = false) => {
  const host = firstHeaderValue(headers['x-forwarded-host'])
    || firstHeaderValue(headers.host)
  if (!VALID_HOST.test(host)) return DEFAULT_ORIGIN

  const forwardedProtocol = firstHeaderValue(headers['x-forwarded-proto'])
  const protocol = forwardedProtocol === 'https' || forwardedProtocol === 'http'
    ? forwardedProtocol
    : encrypted
      ? 'https'
      : 'http'
  return `${protocol}://${host}`
}

export const rewriteSocialImageOrigin = (html, origin) =>
  html.replace(
    /(<meta (?:property="og:image(?::secure_url)?"|name="twitter:image") content=")https:\/\/thersguide\.com/gi,
    `$1${origin}`,
  )
