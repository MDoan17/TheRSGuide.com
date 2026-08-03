const MEDIA_ORIGIN = 'https://media.thersguide.com'
const MEDIA_PREFIX = '/media-proxy/leagues-2/'

const sendText = (res, status, message) => {
  res.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'text/plain; charset=utf-8',
  })
  res.end(message)
}

export async function handleMediaProxy(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('allow', 'GET')
    return sendText(res, 405, 'Method not allowed')
  }

  const requestUrl = new URL(req.url ?? '/', 'http://localhost')
  const pathname = requestUrl.pathname
  if (
    !pathname.startsWith(MEDIA_PREFIX) ||
    pathname.includes('..') ||
    !/\.(?:png|webp)$/i.test(pathname)
  ) {
    return sendText(res, 404, 'Image not found')
  }

  try {
    const upstreamPath = pathname.slice('/media-proxy'.length)
    const response = await fetch(`${MEDIA_ORIGIN}${upstreamPath}`)
    if (!response.ok) return sendText(res, response.status, 'Image not found')

    const body = Buffer.from(await response.arrayBuffer())
    res.writeHead(200, {
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
      'content-length': String(body.length),
      'content-type': response.headers.get('content-type') ?? 'image/png',
    })
    res.end(body)
  } catch {
    return sendText(res, 502, 'Image service unavailable')
  }
}
