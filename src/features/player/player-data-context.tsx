import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { PlayerController } from '@/lib/player-controller'
import {
  playerQuestCompleted,
  playerSkillLevel,
  type PlayerProfile,
} from '@/lib/player-profile'
import { browserPlayerStorage } from '@/lib/player-storage'
import { runemetricsPlayerAdapter } from '@/lib/runemetrics-player-adapter'

export interface PlayerDataContextValue {
  playerData: PlayerProfile | null
  loading: boolean
  error: string | null
  lastSearch: string
  searchPlayer: (username: string) => Promise<void>
  getSkillLevel: (skillName: string) => number | null
  isQuestComplete: (questName: string) => boolean | null
}

const PlayerDataContext = createContext<PlayerDataContextValue | undefined>(undefined)

export function PlayerDataProvider({ children }: { children: ReactNode }) {
  const controller = useMemo(
    () => new PlayerController(runemetricsPlayerAdapter, browserPlayerStorage),
    [],
  )
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  )

  useEffect(() => {
    controller.start()
    return controller.stop
  }, [controller])

  const searchPlayer = useCallback(async (username: string) => {
    await controller.search(username)
  }, [controller])
  const getSkillLevel = useCallback(
    (skillName: string) => playerSkillLevel(state.playerData, skillName),
    [state.playerData],
  )
  const isQuestComplete = useCallback(
    (questName: string) => playerQuestCompleted(state.playerData, questName),
    [state.playerData],
  )

  const value = useMemo(() => ({
    ...state,
    searchPlayer,
    getSkillLevel,
    isQuestComplete,
  }), [getSkillLevel, isQuestComplete, searchPlayer, state])

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  )
}

export function usePlayerData() {
  const context = useContext(PlayerDataContext)
  if (context === undefined) {
    throw new Error('usePlayerData must be used within a PlayerDataProvider')
  }
  return context
}

export type {
  PlayerProfile as PlayerData,
  PlayerQuest as QuestStatus,
  PlayerSkill as SkillLevel,
} from '@/lib/player-profile'
