export type EfficiencyCompletionState = {
  manualChecked: Readonly<Record<string, boolean>>
  questCompletion: Readonly<Record<string, boolean>>
  ignorePlayerData: boolean
}

export function efficiencyRowComplete(
  rowId: string,
  { manualChecked, questCompletion, ignorePlayerData }: EfficiencyCompletionState,
) {
  if (manualChecked[rowId] === true) return true
  return !ignorePlayerData && questCompletion[rowId] === true
}
