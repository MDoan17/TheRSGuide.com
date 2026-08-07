import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { getSharedBuild } from '@/lib/shares-api'
import { shareCodeSchema } from '../../../../shared/share-contract'
import {
  createPicksStateFromSharedBuild,
  type PicksState,
} from '@/lib/picks-state'

export function useSharedBuildImport(onImport: (state: PicksState) => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const shareCode = searchParams.get('share')
  const selectedRejuvenatedRelic = searchParams.get('rejuvenatedRelic') ?? ''

  useEffect(() => {
    if (!shareCode) return

    let isActive = true
    const clearShareCode = () => {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('share')
      nextSearchParams.delete('relicMode')
      nextSearchParams.delete('rejuvenatedRelic')
      setSearchParams(nextSearchParams, { replace: true })
    }

    const parsedCode = shareCodeSchema.safeParse(shareCode)
    if (!parsedCode.success) {
      toast.error('Shared build could not be loaded')
      clearShareCode()
      return
    }

    void getSharedBuild(parsedCode.data)
      .then((build) => {
        if (!isActive) return
        onImport(
          createPicksStateFromSharedBuild(
            build,
            selectedRejuvenatedRelic,
          ),
        )
        clearShareCode()
        toast.success('Shared build loaded', {
          description: 'You can edit and rename it.',
        })
      })
      .catch(() => {
        if (!isActive) return
        clearShareCode()
        toast.error('Shared build could not be loaded')
      })

    return () => {
      isActive = false
    }
  }, [onImport, searchParams, selectedRejuvenatedRelic, setSearchParams, shareCode])
}


