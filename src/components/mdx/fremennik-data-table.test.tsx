import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import fremennikBosses from "@/data/leagues-ii/regions/fremennik/fremennik-bosses.json"
import fremennikFeatures from "@/data/leagues-ii/regions/fremennik/fremennik-features.json"
import fremennikLocations from "@/data/leagues-ii/regions/fremennik/fremennik-locations.json"
import fremennikPvm from "@/data/leagues-ii/regions/fremennik/fremennik-pvm-upgrades.json"
import fremennikSkilling from "@/data/leagues-ii/regions/fremennik/fremennik-skilling-upgrades.json"
import fremennikTeleports from "@/data/leagues-ii/regions/fremennik/fremennik-teleport-relics.json"

const tables = [
  fremennikLocations,
  fremennikBosses,
  fremennikFeatures,
  fremennikPvm,
  fremennikSkilling,
  fremennikTeleports,
]

describe("Fremennik JSON data tables", () => {
  it("renders all six tables with the intended heading hierarchy", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([5, 1, 4, 4, 2, 15])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(6)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(2)
    expect(markup).toContain('id="notable-locations"')
    expect(markup).toContain('id="teleport-relics"')
  })

  it("omits region while retaining the applicable shared table columns", () => {
    expect(fremennikLocations.columns.map(({ key }) => key)).toEqual(["city"])
    expect(fremennikBosses.columns.map(({ key }) => key)).toEqual([
      "boss",
      "location",
    ])
    expect(fremennikFeatures.columns.map(({ key }) => key)).toEqual(["feature"])
    expect(
      tables.every((table) =>
        table.rows.every((row) => !("region" in row))
      )
    ).toBe(true)
    expect(fremennikLocations.columns[0]).toMatchObject({ hidden: true })
    expect(fremennikFeatures.columns[0]).toMatchObject({ hidden: true })
    expect(fremennikBosses.rows[0]).toMatchObject({
      boss: "Dagannoth Kings",
      location: "Waterbirth Island Dungeon",
    })
  })

  it("follows the shared upgrade and teleport table structures", () => {
    const upgradeColumns = ["item", "tier", "style", "source"]

    expect(fremennikPvm.columns.map(({ key }) => key)).toEqual(upgradeColumns)
    expect(fremennikSkilling.columns.map(({ key }) => key)).toEqual(upgradeColumns)
    expect(fremennikTeleports.columns.map(({ key }) => key)).toEqual([
      "relic",
      "loc-type",
      "loc",
    ])
    expect(
      fremennikPvm.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
  })

  it("preserves destinations and assigns the correct skilling disciplines", () => {
    const teleportMarkup = renderToStaticMarkup(
      <DataTable config={{ ...fremennikTeleports, collapsed: false }} />
    )

    expect(fremennikSkilling.rows).toContainEqual(
      expect.objectContaining({ item: "Dragon Hatchet", style: "Woodcutting" })
    )
    expect(fremennikSkilling.rows).toContainEqual(
      expect.objectContaining({ item: "Dragon Pickaxe", style: "Mining" })
    )
    expect(teleportMarkup).toContain("AJR - Slayer cave south-east of Rellekka")
    expect(teleportMarkup).toContain("Fremennik Dungeon")
    expect(teleportMarkup.match(/aria-label="More information about/g)).toHaveLength(2)
  })

  it("uses DataTables in MDX and keeps teleport relics at the bottom", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "map", "fremennik.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(6)
    expect(source).not.toContain("<table>")
    expect(source).not.toContain("<details>")
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{fremennikTeleportRelics\} \/>$/
    )
  })
})
