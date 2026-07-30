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

To enable the settings dialog's feedback form, set `DISCORD_FEEDBACK_WEBHOOK_URL` to a Discord webhook URL in the server environment. The webhook remains server-side and is never included in the browser bundle.

Absolute page and social metadata URLs use `SITE_URL` when provided, then
Coolify's deployment-specific `COOLIFY_URL`, and finally the incoming request
origin. This keeps production and PR preview links on the host that serves them.

The main homepage and Leagues landing page use these build-time environment
variables:

```bash
VITE_HOMEPAGE_MODE=normal
VITE_LEAGUES_START_DATE=2026-08-10T12:00:00Z
VITE_LEAGUES_END_DATE=2026-09-10T12:00:00Z
```

Set `VITE_HOMEPAGE_MODE=leagues` to add and highlight the Leagues button on the
main homepage. Leave it unset or set it to `normal` to hide that button and
highlight Guides instead.

Use ISO-8601 values with an explicit timezone, preferably UTC (`Z`). Before the
start, the page counts down to the start; during the League, it counts down to
the end; at or after the end, it hides the countdown. Changing either value
requires rebuilding the Vite application. The end date above is an example;
set it to the actual event end date in the deployment environment.

## Content

- Add `.mdx` files anywhere beneath `content/`.
- Use frontmatter `title` and `description` fields.
- A branded 1200×630 social preview is generated from each page's `title`,
  `description`, and guide location.
- Optionally set `ogImage` to a public 1200×630 PNG path to replace the generated
  preview, and use `ogImageAlt` to describe it.
- Player-aware MDX components are detected at build time. Use `playerData: true` or
  `playerData: false` only when a page needs to override that detection.
- Use each directory's `meta.json` `pages` array to control navigation order.
- An `index.mdx` file maps to the directory URL, such as `content/guides/index.mdx` → `/guides`.

Reusable MDX components are registered in `src/mdx_components/mdx-components.tsx`. The ShadCN theme and all semantic color tokens live in `src/index.css`.

The Vite content plugin validates navigation references and generates lightweight
route metadata before the app loads. Production builds also include a route-specific
HTML entry for each guide so crawlers receive the correct canonical, Open Graph, and
Twitter metadata—including image dimensions, accessible image text, content section,
and guide topics—without executing JavaScript. Full guide text used by search is
loaded only after a visitor begins searching.
