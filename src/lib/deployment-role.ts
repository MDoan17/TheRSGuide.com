export type DeploymentRole = 'primary' | 'failover'

export const resolveDeploymentRole = (value?: string): DeploymentRole =>
  value?.trim().toLowerCase() === 'failover' ? 'failover' : 'primary'

export const isFailoverDeployment = (value?: string) =>
  resolveDeploymentRole(value) === 'failover'
