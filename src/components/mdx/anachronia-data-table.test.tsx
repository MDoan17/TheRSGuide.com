import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import anachroniaAbilities from "@/data/leagues-ii/regions/anachronia/anachronia-ability-upgrades.json"
import anachroniaBosses from "@/data/leagues-ii/regions/anachronia/anachronia-bosses.json"
import anachroniaFeatures from "@/data/leagues-ii/regions/anachronia/anachronia-features.json"
import anachroniaLocations from "@/data/leagues-ii/regions/anachronia/anachronia-locations.json"
import anachroniaPvm from "@/data/leagues-ii/regions/anachronia/anachronia-pvm-upgrades.json"
import anachroniaSkilling from "@/data/leagues-ii/regions/anachronia/anachronia-skilling-upgrades.json"
import anachroniaTeleports from "@/data/leagues-ii/regions/anachronia/anachronia-teleport-relics.json"

const tables = [
  anachroniaLocations,
  anachroniaBosses,
  anachroniaFeatures,
  anachroniaPvm,
  anachroniaSkilling,
  anachroniaAbilities,
  anachroniaTeleports,
]

describe("Anachronia JSON data tables", () => {
  it("renders all seven tables with the intended heading hierarchy", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([
      1, 3, 9, 14, 3, 5, 10,
    ])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(7)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(3)
    expect(markup).toContain('id="notable-locations"')
    expect(markup).toContain('id="teleport-relics"')
  })

  it("omits region while retaining the applicable shared table columns", () => {
    expect(anachroniaLocations.columns.map(({ key }) => key)).toEqual(["city"])
    expect(anachroniaBosses.columns.map(({ key }) => key)).toEqual([
      "boss",
      "location",
    ])
    expect(anachroniaFeatures.columns.map(({ key }) => key)).toEqual(["feature"])
    expect(
      tables.every((table) =>
        table.rows.every((row) => !("region" in row))
      )
    ).toBe(true)
    expect(anachroniaLocations.columns[0]).toMatchObject({ hidden: true })
    expect(anachroniaFeatures.columns[0]).toMatchObject({ hidden: true })
    expect(anachroniaBosses.rows).toContainEqual(
      expect.objectContaining({ boss: "Raksha", location: "Raksha's Lair" })
    )
  })

  it("follows the shared upgrade and teleport table structures", () => {
    const upgradeColumns = ["item", "tier", "style", "source"]

    expect(anachroniaPvm.columns.map(({ key }) => key)).toEqual(upgradeColumns)
    expect(anachroniaSkilling.columns.map(({ key }) => key)).toEqual(
      upgradeColumns
    )
    expect(anachroniaAbilities.columns.map(({ key }) => key)).toEqual(
      upgradeColumns
    )
    expect(anachroniaAbilities.columns[0].header).toBe("Ability")
    expect(anachroniaTeleports.columns.map(({ key }) => key)).toEqual([
      "relic",
      "loc-type",
      "loc",
    ])
    expect(
      anachroniaPvm.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
  })

  it("preserves grouped upgrades, destinations, links, and info notes", () => {
    const pvmMarkup = renderToStaticMarkup(
      <DataTable config={{ ...anachroniaPvm, collapsed: false }} />
    )
    const skillingMarkup = renderToStaticMarkup(
      <DataTable config={{ ...anachroniaSkilling, collapsed: false }} />
    )
    const teleportMarkup = renderToStaticMarkup(
      <DataTable config={{ ...anachroniaTeleports, collapsed: false }} />
    )

    expect(pvmMarkup).toContain("Laniakea&#x27;s Spear")
    expect(pvmMarkup).toContain("Occultist&#x27;s Ring")
    expect(pvmMarkup).toContain("Shadow Spike")
    expect(pvmMarkup.match(/aria-label="More information about/g)).toHaveLength(1)
    expect(skillingMarkup).toContain("Dragon Mattock")
    expect(skillingMarkup.match(/aria-label="More information about/g)).toHaveLength(1)
    expect(teleportMarkup).toContain("Cactus Patch - Anachronia")
    expect(teleportMarkup).toContain("Venomous Dinosaurs")
    expect(teleportMarkup.match(/aria-label="More information about/g)).toHaveLength(9)
  })

  it("uses DataTables in MDX and keeps teleport relics at the bottom", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "regions", "anachronia.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(7)
    expect(source).not.toContain("<table>")
    expect(source).not.toContain("<details>")
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{anachroniaTeleportRelics\} \/>$/
    )
  })
})
