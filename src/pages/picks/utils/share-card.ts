import blessingData from '@/data/leagues-ii/blessings.json'
import type { RegionSelection } from '@/lib/picks-state'
import { getDisplayRegions, type RegionMapData } from '@/pages/map/utils/map'
import {
  BLESSING_TIERS,
  getBlessingForTier,
  type BlessingId,
  type BlessingSelections,
  type BlessingTier,
} from '../../../../shared/blessings'
import { LEAGUE_OPTIONS } from '../../../../shared/league-options'
import { DEFAULT_BUILD_NAME } from '../../../../shared/share-contract'

const CARD_WIDTH = 1200
const CARD_HEIGHT = 630
const BACKGROUND = '#0a0908'
const SURFACE = '#141210'
const PRIMARY = '#cc9a63'
const FOREGROUND = '#efe4d2'
const MUTED = '#8b7c6b'
const BORDER = 'rgba(204, 154, 99, 0.25)'

const RELIC_BY_ID = new Map(
  LEAGUE_OPTIONS.relicTiers.flatMap((tier) =>
    tier.options.map((relic) => [relic.id, relic] as const),
  ),
)
const BLESSING_PATH_BY_ID = new Map(
  LEAGUE_OPTIONS.blessings.map((blessing) => [blessing.id, blessing] as const),
)
const BLESSING_ID_BY_PATH = new Map(
  LEAGUE_OPTIONS.blessings.map((blessing) => [
    blessing.path.toLowerCase(),
    blessing.id as BlessingId,
  ]),
)
const KNOWN_BLESSING_BY_TIER_AND_ID = new Map(
  blessingData.Blessings.flatMap((blessing) => {
    const blessingId = BLESSING_ID_BY_PATH.get(blessing.path.toLowerCase())
    return blessingId
      ? [[`${blessing.tier}:${blessingId}`, blessing] as const]
      : []
  }),
)
const REGION_OPTION_BY_ID = new Map(
  LEAGUE_OPTIONS.regions.map((region) => [region.id, region]),
)
const imagePromises = new Map<string, Promise<HTMLImageElement | null>>()

export type ResolvedBlessingPicks = Partial<
  Record<BlessingTier, BlessingId>
>
export type PickImageMap = Partial<Record<string, HTMLImageElement>>

function blessingImageKey(tier: BlessingTier, blessingId: BlessingId) {
  return `blessing:${tier}:${blessingId}`
}

function loadImage(key: string, source: string) {
  const cached = imagePromises.get(key)
  if (cached) return cached

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => {
      imagePromises.delete(key)
      resolve(null)
    }
    image.src = source.startsWith('https://media.thersguide.com/')
      ? source.replace('https://media.thersguide.com', '/media-proxy')
      : source
  })
  imagePromises.set(key, promise)
  return promise
}

export async function loadPickImages(
  selectedRelics: Record<number, string>,
  selectedBlessings: BlessingSelections,
): Promise<PickImageMap> {
  const requests: Array<Promise<readonly [string, HTMLImageElement] | null>> = []

  for (const relicId of new Set(Object.values(selectedRelics))) {
    const source = RELIC_BY_ID.get(relicId)?.icon
    if (source) {
      requests.push(
        loadImage(relicId, source).then((image) =>
          image ? ([relicId, image] as const) : null,
        ),
      )
    }
  }

  for (const tier of BLESSING_TIERS) {
    const blessingId = getBlessingForTier(selectedBlessings, tier)
    if (!blessingId) continue
    const knownBlessing = KNOWN_BLESSING_BY_TIER_AND_ID.get(
      `${tier}:${blessingId}`,
    )
    if (!knownBlessing?.image) continue
    const key = blessingImageKey(tier, blessingId)
    requests.push(
      loadImage(key, knownBlessing.image).then((image) =>
        image ? ([key, image] as const) : null,
      ),
    )
  }

  return Object.fromEntries(
    (await Promise.all(requests)).filter(
      (entry): entry is readonly [string, HTMLImageElement] => entry !== null,
    ),
  )
}

function drawSectionHeading(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
) {
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.font = '600 22px "Source Serif 4 Variable", Georgia, serif'
  context.fillStyle = PRIMARY
  context.fillText(label, x, y)
}

function drawCenteredImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  centerX: number,
  top: number,
  maxWidth: number,
  maxHeight: number,
) {
  const intrinsicWidth = image.naturalWidth || image.width
  const intrinsicHeight = image.naturalHeight || image.height
  const scale = Math.min(maxWidth / intrinsicWidth, maxHeight / intrinsicHeight)
  const width = intrinsicWidth * scale
  const height = intrinsicHeight * scale
  context.drawImage(image, centerX - width / 2, top + (maxHeight - height) / 2, width, height)
}

function drawChoiceTile(
  context: CanvasRenderingContext2D,
  options: {
    accentBackground?: string
    fallback: string
    height: number
    image?: HTMLImageElement
    label: string
    selected: boolean
    width: number
    x: number
    y: number
  },
) {
  const { accentBackground, fallback, height, image, label, selected, width, x, y } = options
  context.fillStyle = selected ? (accentBackground ?? SURFACE) : SURFACE
  context.fillRect(x, y, width, height)
  context.strokeStyle = selected ? PRIMARY : BORDER
  context.lineWidth = selected ? 2 : 1
  context.strokeRect(x, y, width, height)

  const imageHeight = height - 35
  if (image) {
    drawCenteredImage(context, image, x + width / 2, y + 5, width - 18, imageHeight)
  } else {
    context.fillStyle = selected ? PRIMARY : MUTED
    context.font = '700 24px "Nunito Variable", sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(fallback, x + width / 2, y + 5 + imageHeight / 2)
  }

  context.fillStyle = selected ? FOREGROUND : MUTED
  context.font = '700 9px "Nunito Variable", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  context.fillText(label.toUpperCase(), x + width / 2, y + height - 10, width - 12)
}

export function drawBuildCard(
  canvas: HTMLCanvasElement,
  buildName: string,
  mapData: RegionMapData | null,
  selectedRelics: Record<number, string>,
  selectedRegions: RegionSelection[],
  selectedBlessings: BlessingSelections,
  pickImages: PickImageMap = {},
) {
  const resolvedBlessings = Object.fromEntries(
    BLESSING_TIERS.flatMap((tier) => {
      const blessing = getBlessingForTier(selectedBlessings, tier)
      return blessing ? [[tier, blessing]] : []
    }),
  ) as ResolvedBlessingPicks

  drawBuildCardFromResolvedPicks(
    canvas,
    buildName,
    mapData,
    selectedRelics,
    selectedRegions,
    resolvedBlessings,
    pickImages,
  )
}

export function drawBuildCardFromResolvedPicks(
  canvas: HTMLCanvasElement,
  buildName: string,
  mapData: RegionMapData | null,
  selectedRelics: Record<number, string>,
  selectedRegions: RegionSelection[],
  selectedBlessings: ResolvedBlessingPicks,
  pickImages: PickImageMap = {},
) {
  const context = canvas.getContext('2d')
  if (!context) return

  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  context.imageSmoothingEnabled = true
  context.fillStyle = BACKGROUND
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
  context.fillStyle = PRIMARY
  context.fillRect(0, 0, CARD_WIDTH, 8)

  context.font = '600 42px "Source Serif 4 Variable", Georgia, serif'
  context.fillStyle = FOREGROUND
  context.textAlign = 'left'
  context.fillText(buildName.trim() || DEFAULT_BUILD_NAME, 48, 96, 1104)
  context.fillStyle = BORDER
  context.fillRect(48, 122, CARD_WIDTH - 96, 1)

  drawSectionHeading(context, 'Relic picks', 48, 156)
  const relicGridX = 48
  const relicGridY = 172
  const relicCellWidth = 102
  const relicCellHeight = 86
  const relicCellGap = 14
  for (let tier = 1; tier <= 8; tier += 1) {
    const column = (tier - 1) % 4
    const row = Math.floor((tier - 1) / 4)
    const relicId = selectedRelics[tier]
    const relic = relicId ? RELIC_BY_ID.get(relicId) : undefined
    drawChoiceTile(context, {
      fallback: relicId?.slice(-1).toUpperCase() ?? '—',
      height: relicCellHeight,
      image: relicId ? pickImages[relicId] : undefined,
      label: relic?.label ?? 'Not selected',
      selected: Boolean(relicId),
      width: relicCellWidth,
      x: relicGridX + column * (relicCellWidth + relicCellGap),
      y: relicGridY + row * (relicCellHeight + relicCellGap),
    })
  }

  drawSectionHeading(context, 'Blessing picks', 48, 400)
  const blessingGridX = 48
  const blessingGridY = 416
  const blessingCellWidth = relicCellWidth
  const blessingCellHeight = relicCellHeight
  const blessingCellGap = relicCellGap
  BLESSING_TIERS.forEach((tier) => {
    const column = (tier - 1) % 4
    const row = Math.floor((tier - 1) / 4)
    const blessingId = selectedBlessings[tier]
    const path = blessingId ? BLESSING_PATH_BY_ID.get(blessingId) : undefined
    const knownBlessing = blessingId
      ? KNOWN_BLESSING_BY_TIER_AND_ID.get(`${tier}:${blessingId}`)
      : undefined
    drawChoiceTile(context, {
      accentBackground: path?.darkColor,
      fallback: path?.shortLabel ?? '—',
      height: blessingCellHeight,
      image: blessingId
        ? pickImages[blessingImageKey(tier, blessingId)]
        : undefined,
      label: knownBlessing?.name ?? path?.label ?? 'Not selected',
      selected: Boolean(blessingId),
      width: blessingCellWidth,
      x: blessingGridX + column * (blessingCellWidth + blessingCellGap),
      y: blessingGridY + row * (blessingCellHeight + blessingCellGap),
    })
  })

  drawSectionHeading(context, 'Region picks', 568, 156)
  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.font = '700 13px "Nunito Variable", sans-serif'
  const displayRegionById = new Map(
    (mapData ? getDisplayRegions(mapData) : []).map((region) => [region.id, region]),
  )
  if (selectedRegions.length > 0) {
    selectedRegions.forEach((region, index) => {
      const y = 181 + index * 17
      context.fillStyle =
        REGION_OPTION_BY_ID.get(region.id)?.color ??
        displayRegionById.get(region.id)?.color ??
        PRIMARY
      context.fillRect(568, y - 10, 10, 10)
      context.fillStyle = FOREGROUND
      context.fillText(region.name, 590, y, 562)
    })
  } else {
    context.fillStyle = MUTED
    context.fillText('No regions selected', 568, 183)
  }

  if (mapData) {
    const mapX = 568
    const mapY = 264
    const mapWidth = 584
    const mapHeight = 272
    const scale = Math.min(mapWidth / mapData.columns, mapHeight / mapData.rows)
    const drawWidth = mapData.columns * scale
    const drawHeight = mapData.rows * scale
    const offsetX = mapX + (mapWidth - drawWidth) / 2
    const offsetY = mapY + (mapHeight - drawHeight) / 2
    const rawSelectedIds = new Set<string>()

    selectedRegions.forEach(({ id }) => {
      const pickerRegion = REGION_OPTION_BY_ID.get(id)
      const superRegion = mapData.superRegions?.find((region) => region.id === id)
      ;(pickerRegion?.regionIds ?? superRegion?.regionIds ?? [id]).forEach(
        (regionId) => rawSelectedIds.add(regionId),
      )
    })

    const regionById = new Map(mapData.regions.map((region) => [region.id, region]))
    const pixelCanvas = document.createElement('canvas')
    pixelCanvas.width = mapData.columns
    pixelCanvas.height = mapData.rows
    const pixelContext = pixelCanvas.getContext('2d')
    if (pixelContext) {
      mapData.pixels.forEach((row, rowIndex) => {
        row.forEach((regionId, columnIndex) => {
          if (!regionId) return
          pixelContext.fillStyle = rawSelectedIds.has(regionId)
            ? (regionById.get(regionId)?.color ?? PRIMARY)
            : '#1a1510'
          pixelContext.fillRect(columnIndex, rowIndex, 1, 1)
        })
      })
      context.imageSmoothingEnabled = false
      context.drawImage(pixelCanvas, offsetX, offsetY, drawWidth, drawHeight)
      context.imageSmoothingEnabled = true
    }
  }

  context.textAlign = 'left'
  context.font = '700 13px "Nunito Variable", sans-serif'
  context.fillStyle = MUTED
  context.textAlign = 'right'
  context.fillText('THERSGUIDE.COM', CARD_WIDTH - 48, 608)
}
