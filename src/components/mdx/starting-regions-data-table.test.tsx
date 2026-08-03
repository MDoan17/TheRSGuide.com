import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import startingRegionsAbilities from "@/data/leagues-ii/regions/starting-regions/starting-regions-ability-upgrades.json"
import startingRegionsBosses from "@/data/leagues-ii/regions/starting-regions/starting-regions-bosses.json"
import startingRegionsFeatures from "@/data/leagues-ii/regions/starting-regions/starting-regions-features.json"
import startingRegionsLocations from "@/data/leagues-ii/regions/starting-regions/starting-regions-locations.json"
import startingRegionsPvm from "@/data/leagues-ii/regions/starting-regions/starting-regions-pvm-upgrades.json"
import startingRegionsSkilling from "@/data/leagues-ii/regions/starting-regions/starting-regions-skilling-upgrades.json"
import startingRegionsTeleports from "@/data/leagues-ii/regions/starting-regions/starting-regions-teleport-relics.json"

const tables = [
  startingRegionsLocations,
  startingRegionsBosses,
  startingRegionsFeatures,
  startingRegionsPvm,
  startingRegionsSkilling,
  startingRegionsAbilities,
  startingRegionsTeleports,
]

describe("Starting Regions JSON data tables", () => {
  it("renders all seven tables with the intended heading hierarchy", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([
      11, 14, 14, 35, 6, 6, 55,
    ])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(7)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(3)
    expect(markup).toContain('id="notable-locations"')
    expect(markup).toContain('id="teleport-relics"')
  })

  it("uses the requested columns for locations, bosses, and features", () => {
    expect(startingRegionsLocations.columns.map(({ key }) => key)).toEqual([
      "city",
      "region",
    ])
    expect(startingRegionsBosses.columns.map(({ key }) => key)).toEqual([
      "boss",
      "location",
      "region",
    ])
    expect(startingRegionsFeatures.columns.map(({ key }) => key)).toEqual([
      "feature",
      "region",
    ])
    expect(startingRegionsBosses.rows).toContainEqual(
      expect.objectContaining({
        boss: "Hermod, the Spirit of War",
        location: "Rasial's Citadel",
        region: "Misthalin",
      })
    )
  })

  it("follows the Wilderness upgrade and teleport table structures", () => {
    expect(startingRegionsPvm.columns.map(({ key }) => key)).toEqual([
      "item",
      "tier",
      "style",
      "source",
    ])
    expect(startingRegionsSkilling.columns.map(({ key }) => key)).toEqual([
      "item",
      "tier",
      "style",
      "source",
    ])
    expect(startingRegionsAbilities.columns.map(({ key }) => key)).toEqual([
      "item",
      "level",
      "style",
      "source",
    ])
    expect(startingRegionsTeleports.columns.map(({ key }) => key)).toEqual([
      "relic",
      "loc-type",
      "loc",
    ])
  })

  it("uses only single numeric PvM tiers or N/A", () => {
    expect(
      startingRegionsPvm.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
    expect(startingRegionsPvm.rows).toContainEqual(
      expect.objectContaining({ id: "scripture-of-wen", tier: "N/A" })
    )
    expect(startingRegionsPvm.rows).toContainEqual(
      expect.objectContaining({ id: "igneous-kal-zuk", tier: "N/A" })
    )
  })

  it("preserves grouped items, destinations, links, and supporting notes", () => {
    const pvmMarkup = renderToStaticMarkup(
      <DataTable config={{ ...startingRegionsPvm, collapsed: false }} />
    )
    const teleportMarkup = renderToStaticMarkup(
      <DataTable config={{ ...startingRegionsTeleports, collapsed: false }} />
    )

    expect(pvmMarkup).toContain("Dark Shard of Leng")
    expect(pvmMarkup).toContain("Dark Sliver of Leng")
    expect(pvmMarkup).toContain("Igneous Kal-Zuk")
    expect(pvmMarkup).toContain('href="https://runescape.wiki/w/Omni_guard"')
    expect(pvmMarkup.match(/aria-label="More information about/g)).toHaveLength(6)
    expect(teleportMarkup).toContain("AIR DLR DJQ AJS - Fairy Queen&#x27;s Hideout")
    expect(teleportMarkup).toContain("The Nexus (Lumbridge Swamp)")
    expect(teleportMarkup.match(/aria-label="More information about/g)).toHaveLength(8)
  })

  it("uses DataTables in MDX and keeps teleport relics at the bottom", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "regions", "starting-regions.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(7)
    expect(source).not.toContain("<table>")
    expect(source).not.toContain("<details>")
    expect(source).not.toMatch(/^#### (Misthalin|Havenhythe)$/m)
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{startingRegionsTeleportRelics\} \/>$/
    )
  })
})
