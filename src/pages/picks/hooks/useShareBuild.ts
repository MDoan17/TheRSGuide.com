import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { createShare } from '@/lib/shares-api'
import type { RegionMapData } from '@/pages/map/utils/map'
import {
  drawBuildCard,
  loadPickImages,
  type PickImageMap,
} from '../utils/share-card'
import { createDiscordShareText, createTwitterShareUrl } from '../utils/share-actions'
import {
  canvasToWebP,
  copyText,
  getShareImageFilename,
} from '../utils/share-browser'
import {
  blessingSelectionsToArray,
  type BlessingSelections,
  type RegionSelection,
} from '@/lib/picks-state'
import { REQUIRED_RELIC_COUNT } from '../../../../shared/share-contract'

export type ShareStatus = 'preparing' | 'creating' | 'ready' | 'error'

type UseShareBuildOptions = {
  buildName: string
  isSpeculativeRelics: boolean
  selectedBlessings: BlessingSelections
  selectedRejuvenatedRelic: string
  selectedRegions: RegionSelection[]
  selectedRelics: Record<number, string>
}

const DISCORD_APP_URL = 'https://discord.com/app'
const SHARE_OPEN_DELAY_MS = 1_000

export function useShareBuild({
  buildName,
  isSpeculativeRelics,
  selectedBlessings,
  selectedRejuvenatedRelic,
  selectedRegions,
  selectedRelics,
}: UseShareBuildOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const requestIdRef = useRef(crypto.randomUUID())
  const sharePromiseRef = useRef<Promise<string> | null>(null)
  const shareOpenTimeoutsRef = useRef<number[]>([])
  const [mapData, setMapData] = useState<RegionMapData | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<ShareStatus>('preparing')
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareAttempt, setShareAttempt] = useState(0)
  const [pickImages, setPickImages] = useState<PickImageMap>({})

  useEffect(() => {
    fetch('/data/leagues/rs3-region-map.json')
      .then((response) => response.json() as Promise<RegionMapData>)
      .then(setMapData)
      .catch(() => setMapData(null))
  }, [])

  useEffect(() => {
    let isActive = true

    void loadPickImages(
      selectedRelics,
      selectedBlessings,
      isSpeculativeRelics,
      selectedRejuvenatedRelic,
    ).then((images) => {
      if (isActive) setPickImages(images)
    })

    return () => {
      isActive = false
    }
  }, [isSpeculativeRelics, selectedBlessings, selectedRejuvenatedRelic, selectedRelics])

  useEffect(() => {
    if (canvasRef.current) {
      drawBuildCard(
        canvasRef.current,
        buildName,
        mapData,
        selectedRelics,
        selectedRegions,
        selectedBlessings,
        pickImages,
        isSpeculativeRelics,
        selectedRejuvenatedRelic,
      )
    }
  }, [
    buildName,
    isSpeculativeRelics,
    mapData,
    pickImages,
    selectedBlessings,
    selectedRegions,
    selectedRejuvenatedRelic,
    selectedRelics,
  ])

  useEffect(() => {
    const scheduledTimeouts = shareOpenTimeoutsRef.current
    return () => {
      for (const timeout of scheduledTimeouts) window.clearTimeout(timeout)
    }
  }, [])

  const scheduleShareDestination = useCallback((url: string, destination: string) => {
    const timeout = window.setTimeout(() => {
      const destinationWindow = window.open(url, '_blank')
      if (destinationWindow) {
        destinationWindow.opener = null
        return
      }
      toast.error(`${destination} could not open`, {
        description: 'Allow pop-ups for The RS Guide and try again.',
      })
    }, SHARE_OPEN_DELAY_MS)
    shareOpenTimeoutsRef.current.push(timeout)
  }, [])

  const createWebPImage = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas || !mapData) throw new Error('The share preview is still loading')
    const loadedPickImages = await loadPickImages(
      selectedRelics,
      selectedBlessings,
      isSpeculativeRelics,
      selectedRejuvenatedRelic,
    )
    await document.fonts.ready
    drawBuildCard(
      canvas,
      buildName,
      mapData,
      selectedRelics,
      selectedRegions,
      selectedBlessings,
      loadedPickImages,
      isSpeculativeRelics,
      selectedRejuvenatedRelic,
    )
    return canvasToWebP(canvas)
  }, [buildName, isSpeculativeRelics, mapData, selectedBlessings, selectedRegions, selectedRejuvenatedRelic, selectedRelics])

  const createShareLink = useCallback(async () => {
    const share = await createShare(
      {
        requestId: requestIdRef.current,
        buildName,
        blessings: blessingSelectionsToArray(selectedBlessings),
        regions: selectedRegions.map((region) => region.id),
        relics: Array.from(
          { length: REQUIRED_RELIC_COUNT },
          (_, index) => selectedRelics[index + 1] ?? '',
        ),
      },
      await createWebPImage(),
    )
    if (!isSpeculativeRelics && !selectedRejuvenatedRelic) {
      return share.shareUrl
    }

    const shareUrl = new URL(share.shareUrl)
    if (isSpeculativeRelics) {
      shareUrl.searchParams.set('relicMode', 'speculative')
    }
    if (selectedRejuvenatedRelic) {
      shareUrl.searchParams.set('rejuvenatedRelic', selectedRejuvenatedRelic)
    }
    return shareUrl.toString()
  }, [buildName, createWebPImage, isSpeculativeRelics, selectedBlessings, selectedRegions, selectedRejuvenatedRelic, selectedRelics])

  useEffect(() => {
    if (!mapData || shareUrl) return

    let isActive = true
    setShareError(null)
    setShareStatus('creating')
    const sharePromise = sharePromiseRef.current ?? createShareLink()
    sharePromiseRef.current = sharePromise
    void sharePromise
      .then((createdShareUrl) => {
        if (!isActive) return
        setShareUrl(createdShareUrl)
        setShareStatus('ready')
      })
      .catch((error: unknown) => {
        sharePromiseRef.current = null
        if (!isActive) return
        setShareStatus('error')
        setShareError(error instanceof Error ? error.message : 'Unable to create share link')
      })

    return () => {
      isActive = false
    }
  }, [createShareLink, mapData, shareAttempt, shareUrl])

  const downloadImage = useCallback(async () => {
    try {
      const blob = await createWebPImage()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = getShareImageFilename(buildName)
      link.href = url
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Unable to create WebP image')
    }
  }, [buildName, createWebPImage])

  const copyLink = useCallback(async () => {
    if (!shareUrl) return
    setShareError(null)
    try {
      await copyText(shareUrl)
      toast.success('Share link copied')
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Unable to copy share link')
    }
  }, [shareUrl])

  const shareToDiscord = useCallback(async () => {
    if (!shareUrl) return
    setShareError(null)
    try {
      await copyText(createDiscordShareText(shareUrl))
      toast.success('Copied for Discord', {
        description: 'Opening Discord',
        duration: 1_800,
      })
      scheduleShareDestination(DISCORD_APP_URL, 'Discord')
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'Unable to copy Discord share text')
    }
  }, [scheduleShareDestination, shareUrl])

  const shareToTwitter = useCallback(() => {
    if (!shareUrl) return
    toast.success('Ready to share on Twitter', {
      description: 'Opening Twitter',
      duration: 1_800,
    })
    scheduleShareDestination(createTwitterShareUrl(shareUrl), 'Twitter')
  }, [scheduleShareDestination, shareUrl])

  const retryShare = useCallback(() => {
    sharePromiseRef.current = null
    setShareError(null)
    setShareAttempt((attempt) => attempt + 1)
  }, [])

  return {
    canvasRef,
    copyLink,
    downloadImage,
    isMapReady: Boolean(mapData),
    retryShare,
    shareError,
    shareStatus,
    shareToDiscord,
    shareToTwitter,
    shareUrl,
  }
}
