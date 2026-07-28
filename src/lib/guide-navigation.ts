import type { GuideNavNode, GuideSection } from '@/lib/guide-catalog'

export type GuideNavigationExpansion = ReadonlySet<string>

export const isNavigationBranchActive = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(`${path}/`)

const collectActiveNodeKeys = (
  nodes: readonly GuideNavNode[],
  pathname: string,
  keys: Set<string>,
) => {
  for (const node of nodes) {
    if (!isNavigationBranchActive(pathname, node.doc.path)) continue
    if (node.children.length) keys.add(node.doc.path)
    collectActiveNodeKeys(node.children, pathname, keys)
  }
}

export const activeNavigationKeys = (
  sections: readonly GuideSection[],
  pathname: string,
): GuideNavigationExpansion => {
  const keys = new Set<string>()
  for (const section of sections) {
    if (!isNavigationBranchActive(pathname, section.path)) continue
    keys.add(section.path)
    collectActiveNodeKeys(section.navigation, pathname, keys)
  }
  return keys
}

export const syncActiveNavigationKeys = (
  expanded: GuideNavigationExpansion,
  sections: readonly GuideSection[],
  pathname: string,
): GuideNavigationExpansion => {
  const activeKeys = activeNavigationKeys(sections, pathname)
  if ([...activeKeys].every((key) => expanded.has(key))) return expanded
  return new Set([...expanded, ...activeKeys])
}

export const setNavigationKeyExpanded = (
  expanded: GuideNavigationExpansion,
  key: string,
  open: boolean,
): GuideNavigationExpansion => {
  if (expanded.has(key) === open) return expanded
  const next = new Set(expanded)
  if (open) next.add(key)
  else next.delete(key)
  return next
}
