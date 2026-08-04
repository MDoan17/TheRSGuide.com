import { describe, expect, it } from 'vitest'
import { findQuest, resolveAllRequirements, type QuestTreeNode } from './quest-requirements'

const flatten = (nodes: QuestTreeNode[]): string[] =>
  nodes.flatMap((node) => [node.name, ...flatten(node.children)])

const depthOf = (nodes: QuestTreeNode[], name: string, depth = 0): number | null => {
  for (const node of nodes) {
    if (node.name.toLowerCase() === name.toLowerCase()) return depth
    const found = depthOf(node.children, name, depth + 1)
    if (found !== null) return found
  }
  return null
}

const sliskesEndgame = () => {
  const quest = findQuest("Sliske's Endgame")
  if (!quest) throw new Error("Sliske's Endgame is missing from quests.json")
  return resolveAllRequirements(quest.requirements.quest, quest.requirements.skill, quest.requirements.other ?? [])
}

describe('resolveAllRequirements quest tree', () => {
  it('lists every quest exactly once', () => {
    const names = flatten(sliskesEndgame().questTree)

    expect(names.length).toBe(new Set(names.map((name) => name.toLowerCase())).size)
  })

  it('lists Stolen Hearts once, which it previously repeated', () => {
    const names = flatten(sliskesEndgame().questTree)

    expect(names.filter((name) => name === 'Stolen Hearts')).toHaveLength(1)
  })

  it('keeps the tree and the header count in agreement', () => {
    const resolved = sliskesEndgame()

    expect(flatten(resolved.questTree)).toHaveLength(resolved.quests.length)
  })

  it('places each quest at the shallowest depth that requires it', () => {
    const { questTree } = sliskesEndgame()

    // One of a Kind is a top-level requirement and names Missing, Presumed
    // Death directly, so it belongs one level down rather than buried
    // underneath a longer branch that also happens to reach it.
    expect(depthOf(questTree, 'One of a Kind')).toBe(0)
    expect(depthOf(questTree, 'Missing, Presumed Death')).toBe(1)
  })

  it('surfaces requirements shared between two top-level quests only once', () => {
    // Kindred Spirits and One of a Kind both require Missing, Presumed Death.
    const names = flatten(resolveAllRequirements(['Kindred Spirits', 'One of a Kind']).questTree)

    expect(names.filter((name) => name === 'Missing, Presumed Death')).toHaveLength(1)
  })

  it('handles repeated and unknown quest names', () => {
    const names = flatten(
      resolveAllRequirements(['Stolen Hearts', 'Stolen Hearts', 'Not A Real Quest']).questTree
    )

    expect(names.filter((name) => name === 'Stolen Hearts')).toHaveLength(1)
    expect(names).toContain('Not A Real Quest')
  })
})
