import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router"
import { describe, expect, it } from "vitest"

import { DocCard, TableScroll, proseComponents } from "@/components/mdx/prose"
import { mdxComponents } from "@/mdx_components/mdx-components"

describe("MDX prose adapters", () => {
  it("preserves authored prose semantics", () => {
    const Heading1 = proseComponents.h1
    const Heading = proseComponents.h2
    const Link = proseComponents.a
    const Code = proseComponents.code
    const Pre = proseComponents.pre
    const Quote = proseComponents.blockquote
    const List = proseComponents.ul
    const ListItem = proseComponents.li
    const Table = proseComponents.table
    const Header = proseComponents.th
    const Cell = proseComponents.td

    const markup = renderToStaticMarkup(
      <>
        <Heading1 id="page-section">Page section</Heading1>
        <Heading id="overview">Overview</Heading>
        <Link href="https://runescape.wiki">RuneScape Wiki</Link>
        <Code>ability</Code>
        <Pre>
          <Code>resonance</Code>
        </Pre>
        <Quote>Use defensives.</Quote>
        <List>
          <ListItem>Prepare</ListItem>
        </List>
        <Table>
          <thead>
            <tr>
              <Header>Requirement</Header>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Cell>Level 50</Cell>
            </tr>
          </tbody>
        </Table>
      </>
    )

    expect(markup).toContain('id="page-section"')
    expect(markup).toContain('id="overview"')
    expect(markup).toContain('href="https://runescape.wiki"')
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noreferrer"')
    expect(markup).toContain("<blockquote")
    expect(markup).toContain("<table")
    expect(markup).toContain("<li")
  })

  it("registers TableScroll as the authored MDX table boundary", () => {
    const markup = renderToStaticMarkup(
      <TableScroll aria-label="Scrollable requirements">
        <table>
          <tbody>
            <tr>
              <td>Requirement</td>
            </tr>
          </tbody>
        </table>
      </TableScroll>
    )

    expect(markup).toContain('data-slot="table-scroll"')
    expect(markup).toContain("Requirement")
    expect(mdxComponents.TableScroll).toBe(TableScroll)
  })

  it("renders navigation cards as links", () => {
    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <DocCard title="Early Game Progression" href="/guides/early-game" />
      </MemoryRouter>
    )

    expect(markup).toContain('href="/guides/early-game"')
    expect(markup).toContain("Early Game Progression")
    expect(markup).toContain('aria-hidden="true"')
  })
})
