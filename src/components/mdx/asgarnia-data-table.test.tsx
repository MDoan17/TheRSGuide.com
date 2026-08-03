import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import asgarniaBosses from "@/data/leagues-ii/regions/asgarnia/asgarnia-bosses.json"
import asgarniaFeatures from "@/data/leagues-ii/regions/asgarnia/asgarnia-features.json"
import asgarniaLocations from "@/data/leagues-ii/regions/asgarnia/asgarnia-locations.json"
import asgarniaPvm from "@/data/leagues-ii/regions/asgarnia/asgarnia-pvm-upgrades.json"
import asgarniaTeleports from "@/data/leagues-ii/regions/asgarnia/asgarnia-teleport-relics.json"

const tables = [
  asgarniaLocations,
  asgarniaBosses,
  asgarniaFeatures,
  asgarniaPvm,
  asgarniaTeleports,
]

describe("Asgarnia JSON data tables", () => {
  it("renders all five tables with the intended heading hierarchy", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([7, 12, 10, 30, 25])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(5)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(1)
    expect(markup).toContain('id="notable-locations"')
    expect(markup).toContain('id="teleport-relics"')
  })

  it("omits region while retaining the applicable shared table columns", () => {
    expect(asgarniaLocations.columns.map(({ key }) => key)).toEqual(["city"])
    expect(asgarniaBosses.columns.map(({ key }) => key)).toEqual([
      "boss",
      "location",
    ])
    expect(asgarniaFeatures.columns.map(({ key }) => key)).toEqual(["feature"])
    expect(
      tables.every((table) =>
        table.rows.every((row) => !("region" in row))
      )
    ).toBe(true)
    expect(asgarniaLocations.columns[0]).toMatchObject({ hidden: true })
    expect(asgarniaFeatures.columns[0]).toMatchObject({ hidden: true })
    expect(asgarniaBosses.rows).toContainEqual(
      expect.objectContaining({
        boss: "Nex, Angel of Death",
        location: "God Wars Dungeon",
      })
    )
  })

  it("follows the shared PvM and teleport table structures", () => {
    expect(asgarniaPvm.columns.map(({ key }) => key)).toEqual([
      "item",
      "tier",
      "style",
      "source",
    ])
    expect(asgarniaTeleports.columns.map(({ key }) => key)).toEqual([
      "relic",
      "loc-type",
      "loc",
    ])
    expect(
      asgarniaPvm.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
  })

  it("preserves grouped upgrades, destinations, links, and info notes", () => {
    const pvmMarkup = renderToStaticMarkup(
      <DataTable config={{ ...asgarniaPvm, collapsed: false }} />
    )
    const teleportMarkup = renderToStaticMarkup(
      <DataTable config={{ ...asgarniaTeleports, collapsed: false }} />
    )

    expect(pvmMarkup).toContain("Armadyl Godsword")
    expect(pvmMarkup).toContain("Off-hand Armadyl Crossbow")
    expect(pvmMarkup).toContain("Tectonic Robe Armour")
    expect(pvmMarkup).toContain("Jessika&#x27;s Sword")
    expect(pvmMarkup.match(/aria-label="More information about/g)).toHaveLength(2)
    expect(teleportMarkup).toContain("AIQ - Mudskipper Point")
    expect(teleportMarkup).toContain("Burthorpe Bank")
    expect(teleportMarkup.match(/aria-label="More information about/g)).toHaveLength(1)
  })

  it("uses DataTables in MDX and keeps teleport relics at the bottom", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "regions", "asgarnia.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(5)
    expect(source).not.toContain("<table>")
    expect(source).not.toContain("<details>")
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{asgarniaTeleportRelics\} \/>$/
    )
  })
})
