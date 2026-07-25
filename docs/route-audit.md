# Route Audit

## Audit date

July 13, 2026

## Scope

- Homepage: 1 route
- MDX content pages: 91 routes
- Total public routes tested: 92

The route list was generated directly from every `content/**/*.mdx` file. Each `index.mdx` file was tested at its directory URL; all other files were tested at their corresponding extensionless URL.

## Checks performed

Every content page received both checks:

1. The production SPA URL returned HTTP 200 and contained the React application root.
2. The corresponding Vite MDX module URL returned HTTP 200 and contained a compiled `MDXContent` export.

The homepage received the production SPA response check.

## Initial endpoint results

| Result | Count |
| --- | ---: |
| Passed | 92 |
| Failed | 0 |

The HTTP checks passed, but this result was a false negative for client rendering. Because the application is an SPA, every route can return the shared application shell even when a lazy-loaded MDX page later fails in React.

## Runtime JSX failure

Manual verification subsequently found render failures on:

- `/setup/client-setup`
- `/setup/interface-setup`
- `/setup/map`

These pages use custom MDX JSX components such as `Card`, `SplitContent`, `Center`, and `InteractiveMapMarker`. The MDX compiler was not configured with `providerImportSource`, so compiled pages did not read the component implementations supplied through `MDXProvider`.

The same configuration defect put all 64 MDX files containing custom JSX at risk.

## Correction

`vite.config.ts` now configures the MDX compiler with:

```ts
providerImportSource: '@mdx-js/react'
```

This makes compiled MDX pages call `useMDXComponents` and resolve custom JSX from the application component registry.

## Post-fix validation

| Check | Passed | Failed |
| --- | ---: | ---: |
| Production build | 1 | 0 |
| Provider-aware MDX modules | 91 | 0 |
| Custom JSX component registrations | 15 | 0 |
| Reported failing pages | 3 | 0 |

All 91 compiled MDX modules now consume the MDX provider. All 15 custom JSX tag names used by the content directory have registered implementations.

## Previously corrected issue

Before this full audit, raw MDX imports were incorrectly processed by the MDX compiler. That caused `content.ts` to receive component functions where it expected source strings. The Vite MDX transform now skips `?raw` requests, and `content.ts` defensively normalizes raw imports. The complete route audit above was performed after that correction.

## Limitations

This audit verifies route availability, MDX compilation, provider integration, and component registration. It does not simulate clicks inside interactive widgets or validate third-party API responses.
