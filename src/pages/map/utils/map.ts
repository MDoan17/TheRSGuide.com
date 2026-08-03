export type Region = {
  color: string
  hoverColor: string
  id: string
  labelPosition?: LabelPosition
  name: string
}

export type LabelPosition = {
  column: number
  row: number
}

export type RegionMapData = {
  columns: number
  pixels: (string | null)[][]
  regions: Region[]
  rows: number
  superRegions?: SuperRegion[]
}

export type SuperRegion = {
  id: string
  name: string
  regionIds: string[]
}

export type DisplayRegion = {
  color?: string
  hoverColor?: string
  id: string
  name: string
  regionIds: string[]
}

export type DrawBounds = {
  height: number
  width: number
  x: number
  y: number
}

export function getDrawBounds(
  width: number,
  height: number,
  columns: number,
  rows: number,
) {
  const padding = width < 700 ? 14 : 24
  const availableWidth = Math.max(1, width - padding * 2)
  const availableHeight = Math.max(1, height - padding * 2)
  const mapAspect = columns / rows
  const viewportAspect = availableWidth / availableHeight
  const drawWidth =
    viewportAspect > mapAspect ? availableHeight * mapAspect : availableWidth
  const drawHeight =
    viewportAspect > mapAspect ? availableHeight : availableWidth / mapAspect

  return {
    height: drawHeight,
    width: drawWidth,
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
  }
}

export function getRegionName(regions: Region[], regionId: string | null) {
  return regions.find((region) => region.id === regionId)?.name ?? null
}

export function getLabelLines(label: string, maxLineLength = 7) {
  const lines: string[] = []

  label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .forEach((word) => {
      const currentLine = lines.at(-1)
      const nextLine = currentLine ? `${currentLine} ${word}` : word

      if (currentLine && nextLine.length > maxLineLength) {
        lines.push(word)
        return
      }

      if (currentLine) {
        lines[lines.length - 1] = nextLine
        return
      }

      lines.push(word)
    })

  return lines
}

export function getDisplayRegionId(
  mapData: RegionMapData,
  regionId: string | null,
) {
  if (!regionId) {
    return null
  }

  return (
    mapData.superRegions?.find((superRegion) =>
      superRegion.regionIds.includes(regionId),
    )?.id ?? regionId
  )
}

export function getDisplayRegions(mapData: RegionMapData): DisplayRegion[] {
  const displayRegions: DisplayRegion[] = []
  const includedIds = new Set<string>()

  mapData.regions.forEach((region) => {
    const superRegion = mapData.superRegions?.find((candidate) =>
      candidate.regionIds.includes(region.id),
    )

    if (superRegion) {
      if (!includedIds.has(superRegion.id)) {
        const firstRegion = mapData.regions.find((candidate) =>
          superRegion.regionIds.includes(candidate.id),
        )
        displayRegions.push({
          color: firstRegion?.color,
          hoverColor: firstRegion?.hoverColor,
          id: superRegion.id,
          name: superRegion.name,
          regionIds: superRegion.regionIds,
        })
        includedIds.add(superRegion.id)
      }
      return
    }

    displayRegions.push({
      color: region.color,
      hoverColor: region.hoverColor,
      id: region.id,
      name: region.name,
      regionIds: [region.id],
    })
  })

  return displayRegions
}

export function getDisplayRegionName(
  mapData: RegionMapData,
  displayRegionId: string | null,
) {
  return getDisplayRegions(mapData).find((region) => region.id === displayRegionId)
    ?.name ?? null
}


