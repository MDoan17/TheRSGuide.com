import { describe, expect, it } from "vitest"

import { PRIVATE_PLAYER_NAME_SELECTOR } from "@/lib/analytics"

describe("analytics privacy selectors", () => {
  it("uses a stable data attribute instead of presentation classes", () => {
    expect(PRIVATE_PLAYER_NAME_SELECTOR).toBe("[data-private-player-name]")
    expect(PRIVATE_PLAYER_NAME_SELECTOR).not.toContain(".")
  })
})
