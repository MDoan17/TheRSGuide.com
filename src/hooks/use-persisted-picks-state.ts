import { useCallback, useEffect, useRef, useState } from 'react'

import {
  loadPicksState,
  PICKS_STORAGE_KEY,
  savePicksState,
  type PicksState,
} from '@/lib/picks-state'

type PicksStatePatch =
  | Partial<PicksState>
  | ((current: PicksState) => Partial<PicksState>)

const PICKS_STATE_SYNC_EVENT = 'rs3:picks-state-sync'

export function usePersistedPicksState() {
  const [picksState, setPicksState] = useState(loadPicksState)
  const picksStateRef = useRef(picksState)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== PICKS_STORAGE_KEY) return
      const nextState = loadPicksState()
      picksStateRef.current = nextState
      setPicksState(nextState)
    }
    const handleLocalSync = (event: Event) => {
      const nextState = (event as CustomEvent<PicksState>).detail
      picksStateRef.current = nextState
      setPicksState(nextState)
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(PICKS_STATE_SYNC_EVENT, handleLocalSync)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(PICKS_STATE_SYNC_EVENT, handleLocalSync)
    }
  }, [])

  const commitPicksState = useCallback((nextState: PicksState) => {
    picksStateRef.current = nextState
    setPicksState(nextState)
    savePicksState(nextState)
    window.dispatchEvent(
      new CustomEvent<PicksState>(PICKS_STATE_SYNC_EVENT, {
        detail: nextState,
      }),
    )
  }, [])

  const updatePicksState = useCallback((patch: PicksStatePatch) => {
    const current = picksStateRef.current
    commitPicksState({
      ...current,
      ...(typeof patch === 'function' ? patch(current) : patch),
    })
  }, [commitPicksState])

  return {
    picksState,
    replacePicksState: commitPicksState,
    updatePicksState,
  }
}
