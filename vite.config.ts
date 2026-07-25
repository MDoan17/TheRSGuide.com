import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import path from 'node:path'
import { handlePlayerApi } from './server/player-api.mjs'

const mdxPlugin = mdx({
  providerImportSource: '@mdx-js/react',
  remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
})
const transformMdx = mdxPlugin.transform as (this: unknown, code: string, id: string) => unknown

const mdxWithoutRaw = {
  ...mdxPlugin,
  enforce: 'pre' as const,
  transform(this: unknown, code: string, id: string) {
    if (id.includes('?raw')) return null
    return transformMdx.call(this, code, id)
  },
}

const playerApiPlugin = () => ({
  name: 'player-api',
  configureServer(server: { middlewares: { use: (handler: (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => void) => void } }) {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/api/player/')) return next()
      void handlePlayerApi(req, res)
    })
  },
})

export default defineConfig({
  plugins: [
    playerApiPlugin(),
    mdxWithoutRaw,
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
