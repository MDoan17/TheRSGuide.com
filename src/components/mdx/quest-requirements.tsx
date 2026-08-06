"use client";

import React, { useMemo, useState } from "react";
import { usePlayerData } from "@/components/player/player-data-context";
import { usePlayerLookup } from "@/components/player/use-player-lookup";
import { resolveAllRequirements, filterQuestTree, QuestTreeNode } from "@/utils/quest-requirements";
import { SkillDrawer } from "./skill-drawer";
import questsData from "@/data/quests.json";

interface SkillRequirement {
  skill: string;
  level: number;
}

interface ManualRequirements {
  quest?: string;
  quests?: string[];
  totalSkills?: SkillRequirement[];
  other?: string[];
}

interface QuestRequirementsProps {
  questName?: string;
  skills?: SkillRequirement[];
  quests?: string[];
  other?: string[];
  manualRequirements?: ManualRequirements;
}

interface SkillRequirementItemProps {
  skill: string;
  level: number;
  onClick: () => void;
}

const SkillRequirementItem: React.FC<SkillRequirementItemProps> = ({ skill, level, onClick }) => {
  const { playerData, getSkillLevel } = usePlayerData();

  const playerLevel = getSkillLevel(skill);
  const hasRequirement = playerLevel !== null && playerLevel >= level;
  const showStatus = playerData !== null;

  const capitalizedSkill = skill.charAt(0).toUpperCase() + skill.slice(1).toLowerCase();
  const skillLower = skill.toLowerCase();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm w-full transition-colors cursor-pointer ${
        !showStatus
          ? "border-border bg-muted/30 hover:bg-muted/50"
          : hasRequirement
          ? "border-[#7d9a78]/50 bg-[#7d9a78]/10 text-[#3d6b35] dark:text-[#a8c4a2] hover:bg-[#7d9a78]/20"
          : "border-[#a07878]/50 bg-[#a07878]/10 text-[#8b4d4d] dark:text-[#c4a2a2] hover:bg-[#a07878]/20"
      }`}
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none">
        <image href={`/skills/${skillLower}.png`} width="16" height="16" />
      </svg>
      <span className="flex-1">{level} {capitalizedSkill}</span>
      {showStatus && (
        hasRequirement ? (
          <svg className="w-4 h-4 text-[#7d9a78] dark:text-[#a8c4a2] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="text-xs text-muted-foreground flex-shrink-0">({playerLevel ?? 1})</span>
        )
      )}
      {/* Training guide indicator */}
      <svg className="w-3 h-3 opacity-40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

const QuestRequirementItem: React.FC<{ quest: string }> = ({ quest }) => {
  const { playerData, isQuestComplete } = usePlayerData();

  const completed = isQuestComplete(quest);
  const showStatus = playerData !== null && completed !== null;

  const handleClick = () => {
    const formattedName = quest.replace(/ /g, "_");
    window.open(`https://runescape.wiki/w/${formattedName}/Quick_guide`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md border text-left text-sm transition-colors w-full ${
        !showStatus
          ? "border-border bg-muted/30 hover:bg-muted/50"
          : completed
          ? "border-[#7d9a78]/50 bg-[#7d9a78]/10 text-[#3d6b35] dark:text-[#a8c4a2] hover:bg-[#7d9a78]/20"
          : "border-[#a07878]/50 bg-[#a07878]/10 text-[#8b4d4d] dark:text-[#c4a2a2] hover:bg-[#a07878]/20"
      }`}
    >
      <span className="flex-1">{quest}</span>
      {showStatus && completed && (
        <svg className="w-4 h-4 text-[#7d9a78] dark:text-[#a8c4a2] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <svg className="w-3 h-3 opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </button>
  );
};

// Depths 0-2 are shown up front; anything deeper unfolds on demand so long
// quest lines don't bury the page in indentation.
const DEFAULT_VISIBLE_DEPTH = 3;

const countDescendants = (node: QuestTreeNode): number =>
  node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);

const countQuests = (nodes: QuestTreeNode[]): number =>
  nodes.reduce((total, node) => total + 1 + countDescendants(node), 0);

/** How many quests sit below the depth shown by default. */
const countCollapsed = (nodes: QuestTreeNode[], depth = 0): number =>
  nodes.reduce(
    (total, node) =>
      total +
      (depth >= DEFAULT_VISIBLE_DEPTH ? 1 : 0) +
      countCollapsed(node.children, depth + 1),
    0
  );

const QuestTreeItem: React.FC<{ node: QuestTreeNode; depth?: number; expandAll?: boolean }> = ({
  node,
  depth = 0,
  expandAll = false,
}) => {
  const collapsible = node.children.length > 0 && depth >= DEFAULT_VISIBLE_DEPTH - 1;
  const [expanded, setExpanded] = useState(!collapsible || expandAll);

  const hiddenCount = useMemo(
    () => (collapsible ? countDescendants(node) : 0),
    [collapsible, node]
  );

  return (
    <div>
      <div style={{ marginLeft: `${depth * 20}px` }}>
        <QuestRequirementItem quest={node.name} />
      </div>
      {expanded && node.children.length > 0 && (
        <div className="mt-1 space-y-1">
          {node.children.map((child, idx) => (
            <QuestTreeItem
              key={`${child.name}-${idx}`}
              node={child}
              depth={depth + 1}
              expandAll={expandAll}
            />
          ))}
        </div>
      )}
      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          aria-expanded={expanded}
          style={{ marginLeft: `${(depth + 1) * 20}px` }}
          className="mt-1 flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {expanded
            ? `Hide ${node.name} requirements`
            : `Show ${hiddenCount} more for ${node.name}`}
        </button>
      )}
    </div>
  );
};

export const QuestRequirements: React.FC<QuestRequirementsProps> = ({
  questName,
  skills = [],
  quests = [],
  other = [],
  manualRequirements,
}) => {
  const { value: inputValue, changeValue, submit: submitPlayer, loading, status } =
    usePlayerLookup({ debounceMs: 1000 });
  const { playerData, getSkillLevel, isQuestComplete } = usePlayerData();
  const [selectedSkill, setSelectedSkill] = useState<{ skill: string; level: number } | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  const [showOnlyMissing, setShowOnlyMissing] = useState(false);

  // Look up quest data from JSON if questName is provided
  const questFromJson = useMemo(() => {
    if (manualRequirements) return null; // Manual overrides skip JSON lookup
    if (!questName) return null;
    return questsData.Quests.find(
      (q: { name: string }) => q.name.toLowerCase() === questName.toLowerCase()
    );
  }, [questName, manualRequirements]);

  // Determine the effective requirements
  const effectiveRequirements = useMemo(() => {
    // Manual requirements take priority
    if (manualRequirements) {
      return {
        name: manualRequirements.quest || questName || "",
        skills: manualRequirements.totalSkills || [],
        quests: manualRequirements.quests || [],
        other: other,
      };
    }

    // Use quest from JSON if found
    if (questFromJson) {
      return {
        name: questFromJson.name,
        skills: questFromJson.requirements?.skill || [],
        quests: questFromJson.requirements?.quest || [],
        other: other,
      };
    }

    // Fall back to props (legacy behavior)
    return {
      name: questName || "",
      skills: skills,
      quests: quests,
      other: other,
    };
  }, [manualRequirements, questFromJson, questName, skills, quests, other]);

  // Recursively resolve all requirements
  const resolved = useMemo(() => {
    return resolveAllRequirements(
      effectiveRequirements.quests,
      effectiveRequirements.skills,
      effectiveRequirements.other
    );
  }, [effectiveRequirements]);

  // Anything we cannot confirm as done stays in the "not met" list — a quest
  // the hiscores don't report on is not evidence the player has finished it,
  // and hiding a requirement someone still needs is the worse failure.
  const visibleSkills = useMemo(
    () =>
      showOnlyMissing
        ? resolved.skills.filter(({ skill, level }) => (getSkillLevel(skill) ?? 0) < level)
        : resolved.skills,
    [resolved.skills, showOnlyMissing, getSkillLevel]
  );
  const visibleQuestTree = useMemo(
    () =>
      showOnlyMissing
        ? filterQuestTree(resolved.questTree, (quest) => isQuestComplete(quest) !== true)
        : resolved.questTree,
    [resolved.questTree, showOnlyMissing, isQuestComplete]
  );
  const visibleQuestCount = useMemo(() => countQuests(visibleQuestTree), [visibleQuestTree]);

  const hasSkills = visibleSkills.length > 0;
  const hasQuests = visibleQuestTree.length > 0;
  const hasOther = resolved.other.length > 0;
  const collapsedCount = useMemo(() => countCollapsed(visibleQuestTree), [visibleQuestTree]);
  // Nothing to filter by until a player is loaded
  const canFilter = playerData !== null && (resolved.skills.length > 0 || resolved.quests.length > 0);

  // Only show the empty state if there's no quest name and no requirements at
  // all — an active filter emptying the columns is not the same thing.
  if (
    !effectiveRequirements.name &&
    resolved.skills.length === 0 &&
    resolved.questTree.length === 0 &&
    !hasOther
  ) {
    return (
      <div className="my-4 p-4 border border-border rounded-lg bg-muted/20">
        <p className="text-muted-foreground">No requirements for this content.</p>
      </div>
    );
  }

  return (
    <>
      <div className="my-4 border border-border rounded-lg bg-card overflow-hidden">
        {/* Wiki Link Header */}
        {effectiveRequirements.name && (
          <a
            href={`https://runescape.wiki/w/${effectiveRequirements.name.replace(/ /g, "_")}/Quick_guide`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between w-full px-4 bg-primary/10 border-b border-border hover:bg-primary/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <img src="/images/favicon/wiki-favicon.ico" alt="" className="w-5 h-5" />
              <span className="font-medium text-foreground">{effectiveRequirements.name} quest guide</span>
            </div>
            <svg className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        <div className="p-4">
          {/* Player Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 pb-4 border-b border-border">
            <div className="relative flex-1 max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Load your stats..."
                value={inputValue}
                onChange={(event) => changeValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  submitPlayer();
                }}
                disabled={loading}
                maxLength={15}
                className="w-full pl-9 pr-20 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={submitPlayer}
                disabled={!inputValue.trim() || loading}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {/* Status pill */}
            {status && (
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  status.kind === "error"
                    ? "bg-[#a07878]/15 text-[#8b4d4d] dark:text-[#c4a2a2]"
                    : "bg-[#7d9a78]/15 text-[#3d6b35] dark:text-[#a8c4a2]"
                }`}
              >
                {status.kind === "error" ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {status.label}
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {status.label}
                  </>
                )}
              </div>
            )}

            {/* Hide anything this player already has */}
            {canFilter && (
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none sm:ml-auto">
                <input
                  type="checkbox"
                  checked={showOnlyMissing}
                  onChange={(event) => setShowOnlyMissing(event.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
                Only show requirements I don't meet
              </label>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Skills Column */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                Skill Requirements
              </h4>
              {hasSkills ? (
                <div className="space-y-1">
                  {visibleSkills.map((req, idx) => (
                    <SkillRequirementItem
                      key={idx}
                      skill={req.skill}
                      level={req.level}
                      onClick={() => setSelectedSkill({ skill: req.skill, level: req.level })}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {showOnlyMissing && resolved.skills.length > 0
                    ? "You meet every skill requirement"
                    : "No skill requirements"}
                </p>
              )}
            </div>

            {/* Quests Column */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between gap-2">
                <span>Quest Requirements {hasQuests && `(${visibleQuestCount})`}</span>
                {collapsedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setExpandAll((previous) => !previous)}
                    className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {expandAll ? "Collapse" : `Expand all (${collapsedCount})`}
                  </button>
                )}
              </h4>
              {hasQuests ? (
                <div className="space-y-1">
                  {visibleQuestTree.map((tree, idx) => (
                    <QuestTreeItem
                      // Remounting on toggle resets each branch to the new default
                      key={`${tree.name}-${idx}-${expandAll}-${showOnlyMissing}`}
                      node={tree}
                      expandAll={expandAll}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {showOnlyMissing && resolved.questTree.length > 0
                    ? "You've completed every quest requirement"
                    : "No quest requirements"}
                </p>
              )}
            </div>
          </div>

          {/* Other Requirements */}
          {hasOther && (
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Other Requirements
              </h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                {resolved.other.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {/* Skill Training Drawer */}
      <SkillDrawer
        skill={selectedSkill?.skill ?? null}
        requiredLevel={selectedSkill?.level}
        open={selectedSkill !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedSkill(null);
        }}
      />
    </>
  );
};
