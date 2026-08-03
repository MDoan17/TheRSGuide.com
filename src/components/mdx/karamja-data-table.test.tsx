import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import karamjaBosses from "@/data/leagues-ii/regions/karamja/karamja-bosses.json"
import karamjaFeatures from "@/data/leagues-ii/regions/karamja/karamja-features.json"
import karamjaLocations from "@/data/leagues-ii/regions/karamja/karamja-locations.json"
import karamjaPvm from "@/data/leagues-ii/regions/karamja/karamja-pvm-upgrades.json"
import karamjaTeleports from "@/data/leagues-ii/regions/karamja/karamja-teleport-relics.json"

const tables = [
  karamjaLocations,
  karamjaBosses,
  karamjaFeatures,
  karamjaPvm,
  karamjaTeleports,
]

describe("Karamja JSON data tables", () => {
  it("renders all five tables with the intended heading hierarchy", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([4, 3, 3, 5, 17])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(5)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(1)
    expect(markup).toContain('id="notable-locations"')
    expect(markup).toContain('id="teleport-relics"')
  })

  it("omits region while retaining the applicable shared table columns", () => {
    expect(karamjaLocations.columns.map(({ key }) => key)).toEqual(["city"])
    expect(karamjaBosses.columns.map(({ key }) => key)).toEqual([
      "boss",
      "location",
    ])
    expect(karamjaFeatures.columns.map(({ key }) => key)).toEqual(["feature"])
    expect(
      tables.every((table) =>
        table.rows.every((row) => !("region" in row))
      )
    ).toBe(true)
    expect(karamjaLocations.columns[0]).toMatchObject({ hidden: true })
    expect(karamjaFeatures.columns[0]).toMatchObject({ hidden: true })
    expect(karamjaBosses.rows).toContainEqual(
      expect.objectContaining({ boss: "TzTok-Jad", location: "Fight Caves" })
    )
  })

  it("follows the shared PvM and teleport table structures", () => {
    expect(karamjaPvm.columns.map(({ key }) => key)).toEqual([
      "item",
      "tier",
      "style",
      "source",
    ])
    expect(karamjaTeleports.columns.map(({ key }) => key)).toEqual([
      "relic",
      "loc-type",
      "loc",
    ])
    expect(
      karamjaPvm.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
  })

  it("preserves drops, destinations, links, and supporting notes", () => {
    const pvmMarkup = renderToStaticMarkup(
      <DataTable config={{ ...karamjaPvm, collapsed: false }} />
    )
    const teleportMarkup = renderToStaticMarkup(
      <DataTable config={{ ...karamjaTeleports, collapsed: false }} />
    )

    expect(pvmMarkup).toContain("Fire Cape")
    expect(pvmMarkup).toContain("TokHaar-Kal-Mor")
    expect(pvmMarkup).toContain('href="https://runescape.wiki/w/Fire_cape"')
    expect(teleportMarkup).toContain("BJR - Realm of the Fisher King")
    expect(teleportMarkup).toContain("Calquat Patch - Tai Bwo Wannai")
    expect(teleportMarkup.match(/aria-label="More information about/g)).toHaveLength(2)
  })

  it("uses DataTables in MDX and keeps teleport relics at the bottom", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "regions", "karamja.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(5)
    expect(source).not.toContain("<table>")
    expect(source).not.toContain("<details>")
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{karamjaTeleportRelics\} \/>$/
    )
  })
})
