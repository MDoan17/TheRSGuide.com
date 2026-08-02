# JSON-powered tables

`DataTable` builds the entire table from one JSON object. Authors do not need to
create a React component, write TypeScript, or configure TanStack Table.

## Add a table

1. Copy an existing table JSON file into `src/data` and replace its rows.
2. Import that JSON file near the top of the MDX page.
3. Pass it to the shared component.

```mdx
import gearTable from '@/data/gear-table.json'

<DataTable config={gearTable} />
```

That is all the code required on the page.

## Smallest useful JSON file

```json
{
  "$schema": "../../schemas/data-table.schema.json",
  "title": "Recommended gear",
  "titleAs": "h3",
  "sortable": true,
  "search": true,
  "columns": [
    { "key": "tier", "filter": true },
    { "key": "item" }
  ],
  "rows": [
    { "tier": 50, "item": "Granite maul" },
    { "tier": 60, "item": "Dragon 2h sword" }
  ]
}
```

The `$schema` line enables JSON validation, descriptions, and autocomplete in
compatible editors. Adjust its relative path when the data file is nested more
deeply.

## Common options

- `title`: Required visible and accessible table name.
- `titleAs`: Heading hierarchy from `h1` through `h6`; defaults to `h2`.
- `headingId`: Optional anchor override; otherwise derived from `title` (for
  example, `PVM Upgrades` becomes `#pvm-upgrades`).
- `sortable`: Makes every column sortable. A column can override this.
- `search`: Use `true`, or provide `label` and `placeholder` text.
- `rowId`: The row field containing a stable unique ID.
- `emptyMessage` and `caption`: Optional supporting text.
- `columns`: Controls which row fields appear and in what order.
- `rows`: Plain JSON records containing the table data.

Column `header` text is optional. When omitted, a key such as `combat_style` is
displayed as “Combat Style”.

## Hidden column headers

Set `"hidden": true` on a column to hide its header visually while keeping the
label available to screen readers. If every column uses it, the column-header
row collapses completely. This is useful for simple one-column tables:

```json
{
  "key": "feature",
  "header": "Feature",
  "hidden": true,
  "link": { "hrefKey": "url", "external": true }
}
```

## Filters

Set `"filter": true` on a column to create its checkbox choices automatically
from the unique values in `rows`:

```json
{ "key": "combat_style", "filter": true }
```

Custom labels or ordering can still be supplied entirely in JSON:

```json
{
  "key": "tier",
  "filter": {
    "label": "Equipment tier",
    "options": [
      { "label": "Tier 50", "value": 50 },
      { "label": "Tier 60", "value": 60 }
    ]
  }
}
```

## Links and presentation

Links are declarative. Store the URL on each row, then tell the displayed column
which field contains it:

```json
{
  "columns": [
    {
      "key": "item",
      "link": { "hrefKey": "url", "external": true }
    }
  ],
  "rows": [
    {
      "item": "Granite maul",
      "url": "https://runescape.wiki/w/Granite_maul"
    }
  ]
}
```

## Optional row information

Set `"info": true` on the column where the info icon should appear. Rows that
contain an `info` field get an icon beside their displayed value; rows without
one remain unchanged. The note opens on hover, keyboard activation, or tap.

```json
{
  "columns": [
    {
      "key": "item",
      "link": { "hrefKey": "url", "external": true },
      "info": true
    }
  ],
  "rows": [
    {
      "item": "Wyvern crossbow",
      "url": "https://runescape.wiki/w/Wyvern_crossbow",
      "info": "Also available in Asgarnia."
    }
  ]
}
```

To use a row field other than `info`, configure it explicitly:

```json
{ "key": "item", "info": { "contentKey": "note" } }
```

Columns also support `align` (`left`, `center`, `right`), `width` (`sm`, `md`,
`lg`), `emphasis`, and `wrap`. These constrained options cover common table
differences without exposing CSS or requiring a component wrapper.

The Wilderness PVM upgrades table is the complete working example in
`src/data/leagues-ii/regions/wilderness/wilderness-pvm-upgrades.json`.
