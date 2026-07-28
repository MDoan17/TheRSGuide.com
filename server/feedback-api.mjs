const MAX_MESSAGE_LENGTH = 1500
const MAX_BODY_BYTES = 10_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_REQUESTS = 3

const rateLimits = new Map()

const send = (res, status, body) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

const requestIp = (req) => {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.socket.remoteAddress ?? 'unknown'
}

const sameOriginRequest = (req) => {
  const origin = req.headers.origin
  if (!origin) return true

  try {
    const forwardedHost = req.headers['x-forwarded-host']
    const host = typeof forwardedHost === 'string'
      ? forwardedHost.split(',')[0].trim()
      : req.headers.host
    return Boolean(host) && new URL(origin).host === host
  } catch {
    return false
  }
}

const withinRateLimit = (req, now = Date.now()) => {
  if (rateLimits.size > 1000) {
    for (const [ip, limit] of rateLimits) {
      if (now - limit.startedAt >= RATE_LIMIT_WINDOW_MS) rateLimits.delete(ip)
    }
  }

  const ip = requestIp(req)
  const current = rateLimits.get(ip)

  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateLimits.set(ip, { count: 1, startedAt: now })
    return true
  }

  if (current.count >= RATE_LIMIT_REQUESTS) return false
  current.count += 1
  return true
}

const readJsonBody = (req) => new Promise((resolve, reject) => {
  let body = ''
  let tooLarge = false

  req.setEncoding('utf8')
  req.on('data', (chunk) => {
    if (tooLarge) return
    body += chunk
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      tooLarge = true
      body = ''
    }
  })
  req.on('end', () => {
    if (tooLarge) {
      reject(new Error('PAYLOAD_TOO_LARGE'))
      return
    }

    try {
      resolve(JSON.parse(body))
    } catch {
      reject(new Error('INVALID_JSON'))
    }
  })
  req.on('error', reject)
})

export function validateFeedbackPayload(payload) {
  const message = typeof payload?.message === 'string' ? payload.message.trim() : ''
  const page = typeof payload?.page === 'string' && payload.page.startsWith('/')
    ? payload.page.slice(0, 300)
    : '/'

  if (!message) return { error: 'Message is required' }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }
  }

  return { message, page }
}

export async function handleFeedbackApi(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST')
    return send(res, 405, { error: 'Method not allowed' })
  }
  if (!sameOriginRequest(req)) return send(res, 403, { error: 'Request origin is not allowed' })
  if (!withinRateLimit(req)) return send(res, 429, { error: 'Please wait before sending another message' })

  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL
  if (!webhookUrl) return send(res, 503, { error: 'Feedback is not configured yet' })

  try {
    const payload = validateFeedbackPayload(await readJsonBody(req))
    if ('error' in payload) return send(res, 400, payload)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'The RS Guide Feedback',
        allowed_mentions: { parse: [] },
        embeds: [{
          title: 'Website feedback',
          description: payload.message,
          color: 0xcc9a63,
          fields: [{ name: 'Page', value: payload.page }],
        }],
      }),
    })

    if (!response.ok) return send(res, 502, { error: 'Unable to deliver this message right now' })
    return send(res, 200, { ok: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
      return send(res, 413, { error: 'Message payload is too large' })
    }
    if (error instanceof Error && error.message === 'INVALID_JSON') {
      return send(res, 400, { error: 'Invalid request body' })
    }
    return send(res, 500, { error: 'Unable to send this message right now' })
  }
}
