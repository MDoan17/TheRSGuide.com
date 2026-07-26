# The RS Guide — Vite SPA

A from-scratch React/Vite rebuild of The RS Guide. The site reads the existing `content/` directory directly as MDX and does not use Fumadocs or Next.js.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Vite's development server also serves the RuneMetrics player endpoint used by the interactive account tools.

## Production

```bash
npm run build
npm start
```

`npm start` serves the compiled SPA, provides history fallback for deep guide URLs, and exposes `/api/player/:username` for RuneMetrics requests. Set `PORT` to change the default port (`4173`).

## Content

- Add `.mdx` files anywhere beneath `content/`.
- Use frontmatter `title` and `description` fields.
- Optionally set `ogImage` to a public image path for page-specific social previews.
- Player-aware MDX components are detected at build time. Use `playerData: true` or
  `playerData: false` only when a page needs to override that detection.
- Use each directory's `meta.json` `pages` array to control navigation order.
- An `index.mdx` file maps to the directory URL, such as `content/guides/index.mdx` → `/guides`.

Reusable MDX components are registered in `src/mdx_components/mdx-components.tsx`. The ShadCN theme and all semantic color tokens live in `src/index.css`.

The Vite content plugin validates navigation references and generates lightweight
route metadata before the app loads. Production builds also include a route-specific
HTML entry for each guide so crawlers receive the correct canonical, Open Graph, and
Twitter metadata without executing JavaScript. Full guide text used by search is
loaded only after a visitor begins searching.
