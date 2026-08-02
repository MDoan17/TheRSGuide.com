import { describe, expect, it } from 'vitest'
import { efficiencyRowComplete } from './efficiency-guide'

const state = {
  manualChecked: { 'manual-row': true },
  questCompletion: { 'quest-row': true },
  ignorePlayerData: false,
}

describe('efficiencyRowComplete', () => {
  it('completes rows from either manual checks or player quest data', () => {
    expect(efficiencyRowComplete('manual-row', state)).toBe(true)
    expect(efficiencyRowComplete('quest-row', state)).toBe(true)
    expect(efficiencyRowComplete('untouched-row', state)).toBe(false)
  })

  it('ignores player quest data once every task has been cleared', () => {
    const cleared = { ...state, manualChecked: {}, ignorePlayerData: true }

    expect(efficiencyRowComplete('quest-row', cleared)).toBe(false)
    expect(efficiencyRowComplete('manual-row', cleared)).toBe(false)
  })

  it('keeps manual checks made after clearing every task', () => {
    const cleared = {
      ...state,
      manualChecked: { 'quest-row': true },
      ignorePlayerData: true,
    }

    expect(efficiencyRowComplete('quest-row', cleared)).toBe(true)
  })
})
