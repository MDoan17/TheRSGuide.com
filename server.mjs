import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'
import { handlePlayerApi } from './server/player-api.mjs'

const root = join(process.cwd(), 'dist')
const mime = { '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' }

createServer((req, res) => {
  if (req.url?.startsWith('/api/player/')) return void handlePlayerApi(req, res)
  const requestPath = decodeURIComponent((req.url ?? '/').split('?')[0])
  const candidate = normalize(join(root, requestPath))
  const safe = candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isFile()
  const file = safe ? candidate : join(root, 'index.html')
  res.writeHead(200, { 'content-type': mime[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}).listen(Number(process.env.PORT ?? 4173), () => console.log(`The RS Guide is listening on http://localhost:${process.env.PORT ?? 4173}`))
