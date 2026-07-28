import { describe, expect, it } from 'vitest'
import type { GuideNavNode, GuideSection } from './guide-catalog'
import {
  activeNavigationKeys,
  isNavigationBranchActive,
  setNavigationKeyExpanded,
  syncActiveNavigationKeys,
} from './guide-navigation'

const EmptyDocument = () => null
const document = (path: string) => ({
  path,
  title: path,
  description: '',
  section: 'guides',
  tableOfContents: [],
  hasTableOfContents: false,
  requiresPlayerData: false,
  ogImage: '',
  Component: EmptyDocument,
})
const node = (path: string, children: GuideNavNode[] = []): GuideNavNode => ({
  doc: document(path),
  label: path,
  children,
})
const sections: GuideSection[] = [{
  id: 'guides',
  label: 'Guides',
  path: '/guides',
  index: document('/guides'),
  documents: [],
  navigation: [
    node('/guides/melee', [
      node('/guides/melee/basic-abilities'),
      node('/guides/melee/advanced', [
        node('/guides/melee/advanced/rotation'),
      ]),
    ]),
    node('/guides/magic', [
      node('/guides/magic/basic-abilities'),
    ]),
  ],
}]

describe('guide navigation model', () => {
  it('identifies exact and descendant branches without prefix collisions', () => {
    expect(isNavigationBranchActive('/guides/melee/basic-abilities', '/guides/melee')).toBe(true)
    expect(isNavigationBranchActive('/guides/melee', '/guides/melee')).toBe(true)
    expect(isNavigationBranchActive('/guides/melee-other', '/guides/melee')).toBe(false)
  })

  it('opens every collapsible ancestor for the current route', () => {
    expect([...activeNavigationKeys(sections, '/guides/melee/advanced/rotation')]).toEqual([
      '/guides',
      '/guides/melee',
      '/guides/melee/advanced',
    ])
  })

  it('preserves user expansion while opening a newly active branch', () => {
    const current = new Set(['/guides', '/guides/magic'])
    const next = syncActiveNavigationKeys(current, sections, '/guides/melee/advanced/rotation')

    expect([...next]).toEqual([
      '/guides',
      '/guides/magic',
      '/guides/melee',
      '/guides/melee/advanced',
    ])
    expect([...current]).toEqual(['/guides', '/guides/magic'])
  })

  it('changes one expansion key without mutating the prior state', () => {
    const current = new Set(['/guides'])
    const opened = setNavigationKeyExpanded(current, '/guides/melee', true)
    const closed = setNavigationKeyExpanded(opened, '/guides', false)

    expect([...current]).toEqual(['/guides'])
    expect([...opened]).toEqual(['/guides', '/guides/melee'])
    expect([...closed]).toEqual(['/guides/melee'])
  })
})
