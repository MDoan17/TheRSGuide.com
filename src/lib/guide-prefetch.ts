type NetworkInformation = {
  effectiveType?: string
  saveData?: boolean
}

const SLOW_CONNECTION = /(^| )(slow-)?2g$/
const REGION_GUIDE_PREFIX = '/leagues/regions/'
const REGION_GUIDE_WITHOUT_TABLE = '/leagues/regions/overview'

let dataTablePromise: Promise<unknown> | null = null

const networkInformation = (): NetworkInformation | undefined =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { connection?: NetworkInformation }).connection

const guidePrefetchAllowed = () => {
  const connection = networkInformation()
  if (!connection) return true
  if (connection.saveData) return false
  return !SLOW_CONNECTION.test(connection.effectiveType ?? '')
}

const guideUsesDataTable = (path: string) =>
  path.startsWith(REGION_GUIDE_PREFIX) && path !== REGION_GUIDE_WITHOUT_TABLE

const preloadDataTable = () => {
  dataTablePromise ??= import('@/components/data-table/data-table').catch((error) => {
    dataTablePromise = null
    throw error
  })
  return dataTablePromise
}

const preloadGuideDependencies = (path: string) =>
  guideUsesDataTable(path) ? preloadDataTable().then(() => undefined) : Promise.resolve()

export {
  guidePrefetchAllowed,
  guideUsesDataTable,
  preloadDataTable,
  preloadGuideDependencies,
}
