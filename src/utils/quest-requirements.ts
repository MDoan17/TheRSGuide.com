import questsData from '@/data/quests.json';

interface QuestSkillReq {
  skill: string;
  level: number;
}

interface QuestData {
  name: string;
  difficulty: number;
  members: boolean;
  questPoints: number;
  requirements: {
    quest: string[];
    skill: QuestSkillReq[];
    other?: string[];
  };
}

interface QuestsJson {
  Quests: QuestData[];
}

export interface QuestTreeNode {
  name: string;
  children: QuestTreeNode[];
}

interface ResolvedRequirements {
  skills: QuestSkillReq[];
  quests: string[];
  questTree: QuestTreeNode[];
  other: string[];
}

const quests = (questsData as QuestsJson).Quests;

// Create a map for quick lookup
const questMap = new Map<string, QuestData>();
quests.forEach((quest) => {
  questMap.set(quest.name.toLowerCase(), quest);
});

/**
 * Find a quest by name (case-insensitive)
 */
export function findQuest(questName: string): QuestData | undefined {
  return questMap.get(questName.toLowerCase());
}

/**
 * Build a deduplicated forest of prerequisite trees for the given quests.
 *
 * Quest requirements form a graph rather than a tree — popular prerequisites
 * like Missing, Presumed Death sit underneath several branches — so walking
 * each branch independently lists those quests once per path they appear on.
 * Instead we breadth-first search the graph, which places every quest exactly
 * once, at the shallowest depth anything requires it from.
 */
function buildQuestForest(questNames: string[]): QuestTreeNode[] {
  const placed = new Set<string>();
  const roots: QuestTreeNode[] = [];
  // Doubles as the BFS queue: it grows as we append children, and the cursor
  // below walks it in breadth-first order.
  const queue: QuestTreeNode[] = [];

  const place = (questName: string, parent: QuestTreeNode | null) => {
    const normalizedName = questName.toLowerCase();
    if (placed.has(normalizedName)) return;
    placed.add(normalizedName);

    const node: QuestTreeNode = { name: questName, children: [] };
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
    queue.push(node);
  };

  questNames.forEach((questName) => place(questName, null));

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const node = queue[cursor];
    const quest = questMap.get(node.name.toLowerCase());
    quest?.requirements.quest.forEach((reqQuest) => place(reqQuest, node));
  }

  return roots;
}

/**
 * Narrow a quest forest to the nodes matching `keep`.
 *
 * A dropped node's kept descendants are lifted into its place rather than
 * discarded. Completing a quest implies completing its prerequisites, so in
 * practice a dropped node has nothing left underneath it — but player data
 * can disagree with the quest data, and dropping a quest someone still needs
 * would be the worse failure.
 */
export function filterQuestTree(
  nodes: QuestTreeNode[],
  keep: (questName: string) => boolean
): QuestTreeNode[] {
  return nodes.flatMap((node) => {
    const children = filterQuestTree(node.children, keep);
    return keep(node.name) ? [{ name: node.name, children }] : children;
  });
}

/**
 * Recursively resolve all requirements for a list of quests
 */
export function resolveAllRequirements(
  questNames: string[],
  initialSkills: QuestSkillReq[] = [],
  initialOther: string[] = []
): ResolvedRequirements {
  const visitedQuests = new Set<string>();
  const allSkills = new Map<string, number>(); // skill -> highest level required
  const allQuests: string[] = [];
  const allOther = new Set<string>();

  // Add initial skills
  initialSkills.forEach((s) => {
    const existing = allSkills.get(s.skill.toLowerCase()) || 0;
    allSkills.set(s.skill.toLowerCase(), Math.max(existing, s.level));
  });

  // Add initial other requirements
  initialOther.forEach((o) => allOther.add(o));

  function resolveQuest(questName: string) {
    const normalizedName = questName.toLowerCase();

    if (visitedQuests.has(normalizedName)) {
      return;
    }
    visitedQuests.add(normalizedName);

    const quest = questMap.get(normalizedName);

    // Add this quest to the list
    allQuests.push(questName);

    if (!quest) {
      // Quest not found in our data, just add it as-is
      return;
    }

    // Add skill requirements (keep highest level for each skill)
    quest.requirements.skill.forEach((s) => {
      const skillKey = s.skill.toLowerCase();
      const existing = allSkills.get(skillKey) || 0;
      allSkills.set(skillKey, Math.max(existing, s.level));
    });

    // Add other requirements
    quest.requirements.other?.forEach((o) => allOther.add(o));

    // Recursively resolve quest requirements
    quest.requirements.quest.forEach((reqQuest) => {
      resolveQuest(reqQuest);
    });
  }

  // Resolve all provided quests
  questNames.forEach((questName) => {
    resolveQuest(questName);
  });

  // Build quest trees for display
  const questTree = buildQuestForest(questNames);

  // Convert skills map back to array with proper capitalization
  const skillsArray: QuestSkillReq[] = Array.from(allSkills.entries())
    .map(([skill, level]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      level,
    }))
    .sort((a, b) => a.skill.localeCompare(b.skill));

  return {
    skills: skillsArray,
    quests: allQuests,
    questTree,
    other: Array.from(allOther),
  };
}

/**
 * Get just the recursive quest chain for a single quest
 */
export function getQuestChain(questName: string): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();

  function resolve(name: string) {
    const normalizedName = name.toLowerCase();
    if (visited.has(normalizedName)) return;
    visited.add(normalizedName);

    const quest = questMap.get(normalizedName);
    if (quest) {
      // First resolve prerequisites
      quest.requirements.quest.forEach((req) => resolve(req));
    }
    // Then add this quest
    chain.push(name);
  }

  resolve(questName);
  return chain;
}
