# Interface System

## Direction
- RuneScape field guide: tactile, editorial, warm, and quietly adventurous.
- Reading and finding a guide are the primary actions; ornament never competes with content.

## Typography
- Cinzel is reserved for brand, headings, and compact navigation labels.
- Nunito carries body copy and interface text for long-form readability.

## Color
- Dark mode uses ink-black brown, cream text, and copper-gold actions.
- Light mode uses parchment surfaces, dark umber text, and aged-gold actions.
- All components consume ShadCN semantic tokens from `src/index.css`.

## Surfaces
- Prefer open layouts, rules, and tonal shifts over stacked cards.
- Borders are fine and copper-tinted; shadows are reserved for overlays.
- Corners stay modest (`--radius: 0.35rem`) to avoid a generic app aesthetic.
- Guide sidebars reuse the card surface: parchment `#DDD3C4` in light mode and deep ink-brown `#141210` in dark mode, with matching theme foreground and navigation tokens.

## Interaction
- Navigation feedback is immediate and understated.
- Page entry and row hover motion may shift only a few pixels.
- Respect reduced-motion preferences.

## Components
- Use ShadCN source components for controls and overlays.
- The homepage preserves the original centered navigation composition: large `The RS Guide` title, the combined guide and future player search directly beneath it, four primary section buttons, and combat-style shortcuts.
- The homepage may use a muted, cover-fit hosted video as a full-bleed background. Always place a dark readability scrim over it, remove the player from keyboard and pointer interaction, persist the user’s on/off preference, and default it off when reduced motion is requested.
- Homepage search autocompletes against titles, descriptions, and page content while debouncing valid RuneScape display-name input against the local RuneMetrics proxy. A matched player result shows the account name and total level and links to `/extras/player`.
- Hide the entire global header on the homepage because its central navigation already covers the same destinations. `Cmd/Ctrl+K` focuses the homepage field and opens the search dialog elsewhere.
- Do not use AI-generated artwork anywhere on the site. Prefer existing first-party assets or functional UI without imagery.
- Documentation layouts use ShadCN `SidebarProvider`, `SidebarHeader`, `SidebarContent`, `SidebarRail`, and `SidebarTrigger`; the sidebar fills its complete allocated column beneath the persistent global navigation and never overlaps it.
- Documentation pages reserve the narrow right column and 50rem reading measure only when an `On this page` table of contents is present. Without one, the main content expands across the available sidebar inset with 64px desktop gutters so bespoke tools can use the workspace without touching the viewport edge.
- The desktop documentation sidebar is `28rem` wide; keep the mobile sheet at its standard `18rem` width.
- Reserve the left third of the desktop sidebar as empty breathing room; header controls and navigation occupy the right two-thirds.
- Long sidebar navigation always scrolls inside a bounded ShadCN `ScrollArea`; never allow `SidebarContent` or the page to expose a native overflow scrollbar.
- Keep the desktop ScrollArea scrollbar visible and use a sidebar-muted thumb. Sidebar row hover feedback uses the theme's darker `--sidebar-accent` surface rather than changing text to the primary gold.
- The collapse control sits at the top-right of the sidebar. Its collapsed-state trigger floats at the content area's top-left with at least `1rem` inset from both the header and viewport edge.
- Sidebar navigation distinguishes directories from documents. Directory names are borderless, toggle-only category labels; each directory's linked `index.mdx` document is the first item inside that category. Closed categories use right chevrons; open categories use down chevrons.
- Guide-specific compositions belong in MDX components and use semantic theme values.
- Search is a command dialog available from the header and Cmd/Ctrl+K.
- The header search dialog uses a 36rem desktop width and keeps its result list inside a bounded ShadCN ScrollArea; never allow result overflow to create a native page scrollbar.
- The `On this page` navigation uses a muted vertical track with a primary-colored progress rail that moves continuously between headings; pair it with a restrained active-link state and `aria-current="location"`.
- Player progression is a wide, standalone React route under Extras. Keep it flat and list-first: a compact username/search header followed immediately by open, rule-separated early, mid, and late recommendation columns. Avoid eyebrow labels, summary cards, repeated descriptions, and dashboard statistics. RuneMetrics confirms quest completion; non-quest recommendations use account-specific, locally persisted ShadCN checkboxes.
- The player progression advisor uses a fixed bottom-right ShadCN Dialog trigger, one featured recommendation, and rule-separated alternatives. Suggestions prioritize ready early-game work and high-impact unlocks, then the nearest locked goal. Keep the character as a functional solid-square placeholder until first-party artwork exists; never replace it with generated art.
- Privacy consent uses a compact, theme-aware bottom banner with equally accessible accept, reject, and customize paths. Optional analytics remain off until explicit consent; a persistent low-emphasis `Privacy settings` control lets visitors reopen the ShadCN preferences dialog and withdraw consent.

## Avoid
- Dashboard card mosaics, bright game-UI chrome, or decorative gradients behind prose.
- Raw status colors when a semantic token or component variant is available.
- More than two typefaces or multiple competing accent colors.
