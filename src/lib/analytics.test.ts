import { describe, expect, it } from "vitest"

import {
  browserPrivacySignalEnabled,
  createAnonymousPageviewPayload,
  LEGACY_RYBBIT_STORAGE_KEYS,
  trackAnonymousPageview,
} from "@/lib/analytics"

describe("anonymous analytics", () => {
  it("sends the route without URL parameters or browser identifiers", () => {
    expect(createAnonymousPageviewPayload(
      "thersguide.com",
      "/guides/skill-training",
    )).toEqual({
      site_id: "d8c35c481bf4",
      hostname: "thersguide.com",
      pathname: "/guides/skill-training",
      querystring: "",
      type: "pageview",
    })
  })

  it("cleans up identifiers left by the old Rybbit script", () => {
    expect(LEGACY_RYBBIT_STORAGE_KEYS).toContain("rybbit-visitor-id")
    expect(LEGACY_RYBBIT_STORAGE_KEYS).toContain("rybbit-user-id")
  })

  it("does nothing when a visitor opts out", () => {
    expect(() => trackAnonymousPageview("navigation", "/guides", false)).not.toThrow()
  })

  it("recognizes Global Privacy Control", () => {
    expect(browserPrivacySignalEnabled({ globalPrivacyControl: true })).toBe(true)
  })

  it("recognizes Do Not Track", () => {
    expect(browserPrivacySignalEnabled({ doNotTrack: "1" })).toBe(true)
    expect(browserPrivacySignalEnabled({ doNotTrack: "yes" })).toBe(true)
  })

  it("allows analytics when the browser sends no privacy signal", () => {
    expect(browserPrivacySignalEnabled({ doNotTrack: "0" })).toBe(false)
  })
})
