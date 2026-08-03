import progression from "./rs3-boss-progression.json"

const fixedDifficulties = new Set([
  "Novice",
  "Easy",
  "Medium",
  "Advanced",
  "Expert",
  "Extreme",
])

const tableForDifficulty = (difficulty: string) => ({
  ...progression,
  title: `${difficulty} Bosses`,
  rows: progression.rows.filter((row) => row.difficulty === difficulty),
})

const noviceBosses = tableForDifficulty("Novice")
const easyBosses = tableForDifficulty("Easy")
const mediumBosses = tableForDifficulty("Medium")
const advancedBosses = tableForDifficulty("Advanced")
const expertBosses = tableForDifficulty("Expert")
const extremeBosses = tableForDifficulty("Extreme")
const variableDifficultyBosses = {
  ...progression,
  title: "Variable Difficulty Bosses",
  rows: progression.rows.filter(
    (row) => !fixedDifficulties.has(row.difficulty)
  ),
}

export {
  advancedBosses,
  easyBosses,
  expertBosses,
  extremeBosses,
  mediumBosses,
  noviceBosses,
  variableDifficultyBosses,
}
