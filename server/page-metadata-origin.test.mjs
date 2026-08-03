import { describe, expect, it } from 'vitest'
import {
  requestOrigin,
  rewritePageMetadataOrigin,
} from './page-metadata-origin.mjs'

describe('page metadata deployment origin', () => {
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

  it('rewrites canonical and social URLs inside the metadata block', () => {
    const html = `
      <!-- page-metadata:start -->
      <link rel="canonical" href="https://thersguide.com/guides/skill-training" />
      <meta property="og:url" content="https://thersguide.com/guides/skill-training" />
      <meta property="og:image" content="https://thersguide.com/og/guides-skill-training.png" />
      <meta property="og:image:secure_url" content="https://thersguide.com/og/guides-skill-training.png" />
      <meta name="twitter:image" content="https://thersguide.com/og/guides-skill-training.png" />
      <meta name="twitter:image:alt" content="Skill Training Guide preview" />
      <!-- page-metadata:end -->
      <script src="https://thersguide.com/external-example.js"></script>
    `
    const rewritten = rewritePageMetadataOrigin(
      html,
      'https://staging-15.thersguide.com',
    )

    expect(rewritten).toContain(
      'rel="canonical" href="https://staging-15.thersguide.com/guides/skill-training"',
    )
    expect(rewritten).toContain(
      'property="og:url" content="https://staging-15.thersguide.com/guides/skill-training"',
    )
    const metadataBlock = rewritten.match(
      /<!-- page-metadata:start -->[\s\S]*?<!-- page-metadata:end -->/,
    )?.[0]
    expect(metadataBlock).toBeDefined()
    expect(metadataBlock).not.toContain('https://thersguide.com/')
    expect(rewritten).toContain(
      'name="twitter:image:alt" content="Skill Training Guide preview"',
    )
    expect(rewritten).toContain(
      '<script src="https://thersguide.com/external-example.js"></script>',
    )
  })
})
