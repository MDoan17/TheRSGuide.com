const healthPayload = JSON.stringify({ status: 'ok' })

export function isHealthRequest(req) {
  try {
    return new URL(req.url ?? '/', 'http://localhost').pathname === '/health'
  } catch {
    return false
  }
}

export function handleHealth(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      allow: 'GET, HEAD',
      'cache-control': 'no-store',
      'content-type': 'text/plain; charset=utf-8',
    })
    res.end('Method not allowed')
    return
  }

  res.writeHead(200, {
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(healthPayload),
    'content-type': 'application/json; charset=utf-8',
  })
  res.end(req.method === 'HEAD' ? undefined : healthPayload)
}
