import { describe, expect, it } from "vitest"

import {
  RYBBIT_OPT_OUT_KEY,
  RYBBIT_STORAGE_KEYS,
} from "@/lib/analytics"

describe("analytics privacy storage", () => {
  it("uses Rybbit's persistent opt-out flag", () => {
    expect(RYBBIT_OPT_OUT_KEY).toBe("disable-rybbit")
  })

  it("forgets browser identifiers when analytics is disabled", () => {
    expect(RYBBIT_STORAGE_KEYS).toContain("rybbit-visitor-id")
    expect(RYBBIT_STORAGE_KEYS).toContain("rybbit-user-id")
  })
})
