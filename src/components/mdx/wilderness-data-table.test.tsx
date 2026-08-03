import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable } from "@/components/data-table/data-table"
import wildernessAbilityUpgrades from "@/data/leagues-ii/regions/wilderness/wilderness-ability-upgrades.json"
import wildernessBosses from "@/data/leagues-ii/regions/wilderness/wilderness-bosses.json"
import wildernessFeatures from "@/data/leagues-ii/regions/wilderness/wilderness-features.json"
import wildernessLocations from "@/data/leagues-ii/regions/wilderness/wilderness-locations.json"
import wildernessPvmUpgrades from "@/data/leagues-ii/regions/wilderness/wilderness-pvm-upgrades.json"
import wildernessTeleportRelics from "@/data/leagues-ii/regions/wilderness/wilderness-teleport-relics.json"
import wildernessUtilityUpgrades from "@/data/leagues-ii/regions/wilderness/wilderness-utility-upgrades.json"

const tables = [
  wildernessLocations,
  wildernessBosses,
  wildernessFeatures,
  wildernessPvmUpgrades,
  wildernessAbilityUpgrades,
  wildernessUtilityUpgrades,
  wildernessTeleportRelics,
]

describe("Wilderness JSON data tables", () => {
  it("renders all seven page tables with the intended heading levels", () => {
    const markup = tables
      .map((config) => renderToStaticMarkup(<DataTable config={config} />))
      .join("")

    expect(tables.map((table) => table.rows.length)).toEqual([3, 10, 6, 47, 4, 4, 8])
    expect(tables.every((table) => table.collapsed)).toBe(true)
    expect(markup.match(/data-slot="data-table"/g)).toHaveLength(7)
    expect(markup.match(/<h2/g)).toHaveLength(4)
    expect(markup.match(/<h3/g)).toHaveLength(3)
    expect(markup).toContain("Locations</h2>")
    expect(markup).toContain("Bosses</h2>")
    expect(markup).toContain("Features</h2>")
    expect(markup).toContain("Teleport Relics</h2>")
    expect(markup).toContain("PVM Upgrades</h3>")
    expect(markup).toContain('id="pvm-upgrades"')
    expect(markup).toContain('aria-labelledby="pvm-upgrades"')
    expect(markup).not.toMatch(/id="_r_[^"]+-title"/)
    expect(wildernessAbilityUpgrades.columns.map(({ key }) => key)).toEqual([
      "item",
      "level",
      "style",
      "source",
    ])
  })

  it("preserves every location, boss grouping, feature, and Wiki link", () => {
    const markup = tables
      .slice(0, 3)
      .map((config) => renderToStaticMarkup(
        <DataTable config={{ ...config, collapsed: false }} />
      ))
      .join("")

    expect(markup).toContain("Wilderness Crater")
    expect(markup).toContain("Flesh-hatcher Mhekarnahz")
    expect(markup).toContain("Elite Dungeon 2")
    expect(markup).toContain("Elite Dungeon 3")
    expect(markup).toContain("The Ambassador")
    expect(markup).toContain("Daemonheim Dig Site")
    expect(markup).toContain(
      'href="https://runescape.wiki/w/Dragonkin_Laboratory"'
    )
    expect(markup).toContain('href="https://runescape.wiki/w/The_Ambassador"')
    expect(markup).toContain('href="https://runescape.wiki/w/Ores#Primal_ores"')
  })

  it("uses only single numeric PvM tiers or N/A", () => {
    expect(
      wildernessPvmUpgrades.rows.every(({ tier }) => /^(?:\d+|N\/A)$/.test(tier))
    ).toBe(true)
    expect(wildernessPvmUpgrades.rows).toContainEqual(
      expect.objectContaining({ id: "primal-equipment", tier: "90" })
    )
  })

  it("collapses an all-hidden header row without removing its accessible label", () => {
    const locationsMarkup = renderToStaticMarkup(
      <DataTable config={{ ...wildernessLocations, collapsed: false }} />
    )
    const featuresMarkup = renderToStaticMarkup(
      <DataTable config={{ ...wildernessFeatures, collapsed: false }} />
    )

    expect(wildernessLocations.columns[0].hidden).toBe(true)
    expect(wildernessFeatures.columns[0].hidden).toBe(true)
    expect(locationsMarkup).toContain('<span class="sr-only">Location</span>')
    expect(featuresMarkup).toContain('<span class="sr-only">Feature</span>')
    expect(locationsMarkup).toContain("h-0 border-0 bg-transparent")
    expect(featuresMarkup).toContain("h-0 border-0 bg-transparent")
    expect(locationsMarkup).toContain("h-0 p-0")
    expect(featuresMarkup).toContain("h-0 p-0")
  })

  it("preserves every teleport relic unlock and its supporting information", () => {
    const markup = renderToStaticMarkup(
      <DataTable config={{ ...wildernessTeleportRelics, collapsed: false }} />
    )

    expect(wildernessTeleportRelics.rows).toHaveLength(8)
    expect(markup).toContain("Nature&#x27;s Network")
    expect(markup).toContain("Assassin&#x27;s Insight")
    expect(markup).toContain("Voidwalker")
    expect(markup).toContain("ALR - Other realms: Abyss")
    expect(markup).toContain("Graveyard of Shadows")
    expect(markup.match(/aria-label="More information about/g)).toHaveLength(2)
    expect(wildernessTeleportRelics.rows).toContainEqual(
      expect.objectContaining({
        loc: "Stalker Dungeon",
        info: "Requires the Dishonour among Thieves quest.",
      })
    )
  })

  it("uses DataTables in MDX instead of the three legacy lists", () => {
    const source = readFileSync(
      resolve(process.cwd(), "content", "leagues", "regions", "wilderness.mdx"),
      "utf8"
    )

    expect(source.match(/<DataTable config=\{/g)).toHaveLength(7)
    expect(source).not.toMatch(/^## (Locations|Bosses|Features)$/m)
    expect(source).not.toContain("- [Wilderness Crater]")
    expect(source).not.toContain("- [King Black Dragon]")
    expect(source).not.toContain("- [Wilderness Slayer]")
    expect(source).not.toContain("<details>")
    expect(source).not.toMatch(/^### Teleport Relics$/m)
    expect(source.match(/^## Notable Gear$/gm)).toHaveLength(1)
    expect(source.trimEnd()).toMatch(
      /<DataTable config=\{wildernessTeleportRelics\} \/>$/
    )
  })
})
