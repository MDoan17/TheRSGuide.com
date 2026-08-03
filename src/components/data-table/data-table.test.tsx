import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { DataTable, type DataTableConfig } from "@/components/data-table/data-table"

const config: DataTableConfig = {
  title: "Example table",
  columns: [{ key: "name", header: "Name" }],
  rows: [{ name: "Visible row" }],
}

describe("DataTable collapsed configuration", () => {
  it("starts with only headers visible when collapsed is true", () => {
    const markup = renderToStaticMarkup(
      <DataTable config={{ ...config, collapsed: true }} />
    )

    expect(markup).toContain('aria-expanded="false"')
    expect(markup).toContain('aria-label="Expand Example table"')
    expect(markup).not.toContain("Name")
    expect(markup).not.toContain("Visible row")
    expect(markup).toContain("lucide-chevron-right")
  })

  it("starts expanded but remains collapsible when collapsed is false", () => {
    const markup = renderToStaticMarkup(
      <DataTable config={{ ...config, collapsed: false }} />
    )

    expect(markup).toContain('aria-expanded="true"')
    expect(markup).toContain('aria-label="Collapse Example table"')
    expect(markup).toContain("Visible row")
    expect(markup).toContain("lucide-chevron-down")
  })

  it("does not add a collapse control when collapsed is omitted", () => {
    const markup = renderToStaticMarkup(<DataTable config={config} />)

    expect(markup).not.toContain('aria-controls="')
    expect(markup).toContain("Visible row")
  })
})
