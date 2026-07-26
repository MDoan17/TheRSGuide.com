import { describe, expect, it } from 'vitest'
import {
  requestOrigin,
  rewriteSocialImageOrigin,
} from './social-image-origin.mjs'

describe('social image deployment origin', () => {
  it('uses the proxy-facing staging origin', () => {
    expect(requestOrigin({
      host: 'internal:4173',
      'x-forwarded-host': 'staging-15.thersguide.com',
      'x-forwarded-proto': 'https',
    })).toBe('https://staging-15.thersguide.com')
  })

  it('falls back safely when a host header is invalid', () => {
    expect(requestOrigin({ host: 'bad.example.com"><script>' })).toBe(
      'https://thersguide.com',
    )
  })

  it('rewrites only social image URLs', () => {
    const html = `
      <link rel="canonical" href="https://thersguide.com/guides/skill-training" />
      <meta property="og:url" content="https://thersguide.com/guides/skill-training" />
      <meta property="og:image" content="https://thersguide.com/og/guides-skill-training.png" />
      <meta property="og:image:secure_url" content="https://thersguide.com/og/guides-skill-training.png" />
      <meta name="twitter:image" content="https://thersguide.com/og/guides-skill-training.png" />
      <meta name="twitter:image:alt" content="Skill Training Guide preview" />
    `
    const rewritten = rewriteSocialImageOrigin(
      html,
      'https://staging-15.thersguide.com',
    )

    expect(rewritten).toContain(
      'rel="canonical" href="https://thersguide.com/guides/skill-training"',
    )
    expect(rewritten).toContain(
      'property="og:url" content="https://thersguide.com/guides/skill-training"',
    )
    expect(rewritten.match(/https:\/\/staging-15\.thersguide\.com\/og\//g)).toHaveLength(3)
    expect(rewritten).toContain(
      'name="twitter:image:alt" content="Skill Training Guide preview"',
    )
  })
})
