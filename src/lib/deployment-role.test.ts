import { describe, expect, it } from 'vitest'

import { isFailoverDeployment, resolveDeploymentRole } from './deployment-role'

describe('deployment role', () => {
  it('defaults missing and unrecognized values to the primary deployment', () => {
    expect(resolveDeploymentRole()).toBe('primary')
    expect(resolveDeploymentRole('backup')).toBe('primary')
    expect(resolveDeploymentRole('true')).toBe('primary')
  })

  it('accepts the failover value without case or surrounding whitespace sensitivity', () => {
    expect(resolveDeploymentRole('failover')).toBe('failover')
    expect(resolveDeploymentRole('  FAILOVER  ')).toBe('failover')
    expect(isFailoverDeployment('failover')).toBe(true)
  })
})
