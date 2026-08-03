import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import kandarinBosses from "@/data/leagues-ii/regions/kandarin/kandarin-bosses.json"
import kandarinFeatures from "@/data/leagues-ii/regions/kandarin/kandarin-features.json"
import kandarinLocations from "@/data/leagues-ii/regions/kandarin/kandarin-locations.json"
import kandarinPvm from "@/data/leagues-ii/regions/kandarin/kandarin-pvm-upgrades.json"
import kandarinTeleports from "@/data/leagues-ii/regions/kandarin/kandarin-teleport-relics.json"

const tables = [
  kandarinLocations,
  kandarinBosses,
  kandarinFeatures,
  kandarinPvm,
  kandarinTeleports,
]

describe("Kandarin JSON data tables", () => {
  it("renders all five tables with the intended heading hierarchy", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([9, 1, 14, 9, 48])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(5)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(1)
    expect(markup).toContain('id="notable-locations"')
    expect(markup).toContain('id="teleport-relics"')
  })

  it("omits region while retaining the applicable shared table columns", () => {
    expect(kandarinLocations.columns.map(({ key }) => key)).toEqual(["city"])
    expect(kandarinBosses.columns.map(({ key }) => key)).toEqual([
      "boss",
      "location",
    ])
    expect(kandarinFeatures.columns.map(({ key }) => key)).toEqual(["feature"])
    expect(
      tables.every((table) =>
        table.rows.every((row) => !("region" in row))
      )
    ).toBe(true)
    expect(kandarinLocations.columns[0]).toMatchObject({ hidden: true })
    expect(kandarinFeatures.columns[0]).toMatchObject({ hidden: true })
    expect(kandarinBosses.rows[0]).toMatchObject({
      boss: "Legiones",
      location: "Monastery of Ascension",
    })
  })

  it("follows the shared PvM and teleport structures with normalized tiers", () => {
    expect(kandarinPvm.columns.map(({ key }) => key)).toEqual([
      "item",
      "tier",
      "style",
      "source",
    ])
    expect(kandarinTeleports.columns.map(({ key }) => key)).toEqual([
      "relic",
      "loc-type",
      "loc",
    ])
    expect(
      kandarinPvm.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
    expect(
      kandarinPvm.rows
        .filter(({ source }) => source === "Eternal Magic Trees")
        .every(({ tier }) => tier === "90")
    ).toBe(true)
    expect(kandarinPvm.rows[0]).toMatchObject({
      item: "Ascension Crossbow",
      style: "Range",
    })
  })

  it("preserves grouped upgrades, destinations, and supporting notes", () => {
    const pvmMarkup = renderToStaticMarkup(
      <DataTable config={{ ...kandarinPvm, collapsed: false }} />
    )
    const teleportMarkup = renderToStaticMarkup(
      <DataTable config={{ ...kandarinTeleports, collapsed: false }} />
    )

    expect(pvmMarkup).toContain("Off-hand Ascension Crossbow")
    expect(pvmMarkup).toContain("Eternal Magic Staff (Saturated)")
    expect(pvmMarkup.match(/aria-label="More information about/g)).toHaveLength(1)
    expect(teleportMarkup).toContain("AKQ - Piscatoris Hunter area")
    expect(teleportMarkup).toContain("Jade Vine Patch - Ardougne")
    expect(teleportMarkup).toContain("Camelot")
    expect(teleportMarkup.match(/aria-label="More information about/g)).toHaveLength(7)
  })

  it("uses DataTables in MDX and keeps teleport relics at the bottom", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "regions", "kandarin.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(5)
    expect(source).not.toContain("<table>")
    expect(source).not.toContain("<details>")
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{kandarinTeleportRelics\} \/>$/
    )
  })
})
