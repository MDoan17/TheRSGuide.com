import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { FailoverNotice } from '@/components/site/failover-notice'

describe('FailoverNotice', () => {
  it('does not render on the primary deployment', () => {
    expect(
      renderToStaticMarkup(<FailoverNotice deploymentRole="primary" />),
    ).toBe('')
  })

  it('renders the approved, dismissible status message on failover', () => {
    const markup = renderToStaticMarkup(
      <FailoverNotice deploymentRole="failover" />,
    )

    expect(markup).toContain('role="status"')
    expect(markup).toContain('higher-than-usual traffic')
    expect(markup).toContain('redirected to our backup site')
    expect(markup).toContain('aria-label="Dismiss traffic notice"')
  })
})
