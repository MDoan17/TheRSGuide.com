const SHARES_ORIGIN = process.env.SHARES_API_ORIGIN
  ?? 'https://rs3leagues-share-worker.thejonesofjustice.workers.dev'
const MAX_PROXY_BODY_BYTES = 5 * 1024 * 1024
const SHARE_PATH = /^\/api\/shares(?:\/[A-Za-z0-9_-]{10})?(?:\?.*)?$/

const sendJson = (res, status, body) => {
  res.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  res.end(JSON.stringify(body))
}

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = []
  let size = 0

  req.on('data', (chunk) => {
    size += chunk.length
    if (size > MAX_PROXY_BODY_BYTES) {
      reject(new Error('PAYLOAD_TOO_LARGE'))
      return
    }
    chunks.push(chunk)
  })
  req.on('end', () => resolve(Buffer.concat(chunks)))
  req.on('error', reject)
})

export async function handleSharesApi(req, res) {
  const requestPath = req.url ?? ''
  if (!SHARE_PATH.test(requestPath)) {
    return sendJson(res, 404, { error: 'Share not found' })
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('allow', 'GET, POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  try {
    const body = req.method === 'POST' ? await readBody(req) : undefined
    const headers = new Headers({ accept: 'application/json' })
    if (req.headers['content-type']) {
      headers.set('content-type', req.headers['content-type'])
    }

    const response = await fetch(`${SHARES_ORIGIN}${requestPath}`, {
      body,
      headers,
      method: req.method,
    })
    const responseBody = Buffer.from(await response.arrayBuffer())
    res.writeHead(response.status, {
      'cache-control': response.headers.get('cache-control') ?? 'no-store',
      'content-type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    })
    res.end(responseBody)
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
      return sendJson(res, 413, { error: 'Share upload is too large' })
    }
    return sendJson(res, 502, { error: 'The share service is unavailable' })
  }
}
