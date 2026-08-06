import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowRight } from 'lucide-react'
import { regionMapData } from '@/data/leagues/region-map-data'
import {
  guidePrefetchAllowed,
  preloadDataTable,
} from '@/lib/guide-prefetch'
import {
  displayRegionId,
  displayRegions,
  getRegionMapBounds,
  regionGuidePath,
  regionLabelLines,
  type RegionMapBounds,
} from '@/lib/leagues-region-map'

const EMPTY_SIZE = { height: 1, width: 1 }

function useElementSize(ref: RefObject<HTMLCanvasElement | null>) {
  const [size, setSize] = useState(EMPTY_SIZE)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const updateSize = () => {
      const bounds = element.getBoundingClientRect()
      setSize({
        height: Math.max(1, bounds.height),
        width: Math.max(1, bounds.width),
      })
    }
    const observer = new ResizeObserver(updateSize)
    updateSize()
    observer.observe(element)
    window.addEventListener('resize', updateSize)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateSize)
    }
  }, [ref])

  return size
}

export default function LeaguesRegionMap() {
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boundsRef = useRef<RegionMapBounds | null>(null)
  const size = useElementSize(canvasRef)
  const [hoveredRegionId, setHoveredRegionId] = useState<string | null>(null)

  const regions = useMemo(() => displayRegions(regionMapData), [])
  const regionById = useMemo(
    () => new Map(regionMapData.regions.map((region) => [region.id, region])),
    [],
  )
  const displayedRegionById = useMemo(
    () => new Map(regions.map((region) => [region.id, region])),
    [regions],
  )
  const highlightedSourceIds = useMemo(
    () => new Set(
      hoveredRegionId
        ? displayedRegionById.get(hoveredRegionId)?.regionIds ?? [hoveredRegionId]
        : [],
    ),
    [displayedRegionById, hoveredRegionId],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(size.width * dpr)
    canvas.height = Math.floor(size.height * dpr)
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, size.width, size.height)

    const bounds = getRegionMapBounds(
      size.width,
      size.height,
      regionMapData.columns,
      regionMapData.rows,
    )
    boundsRef.current = bounds
    const cellWidth = bounds.width / regionMapData.columns
    const cellHeight = bounds.height / regionMapData.rows
    context.imageSmoothingEnabled = false

    for (let row = 0; row < regionMapData.rows; row += 1) {
      for (let column = 0; column < regionMapData.columns; column += 1) {
        const sourceRegionId = regionMapData.pixels[row]?.[column]
        if (!sourceRegionId) continue
        const region = regionById.get(sourceRegionId)
        context.fillStyle = highlightedSourceIds.has(sourceRegionId)
          ? (region?.hoverColor ?? '#fef08a')
          : (region?.color ?? '#2a3a30')
        context.fillRect(
          Math.floor(bounds.x + column * cellWidth),
          Math.floor(bounds.y + row * cellHeight),
          Math.ceil(cellWidth) + 1,
          Math.ceil(cellHeight) + 1,
        )
      }
    }

    const fontSize = Math.max(8, Math.min(13, cellWidth * 1.65))
    context.font = `700 ${fontSize}px ui-monospace, monospace`
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    for (const region of regionMapData.regions) {
      if (!region.labelPosition) continue
      const x = bounds.x + (region.labelPosition.column + 0.5) * cellWidth
      const y = bounds.y + (region.labelPosition.row + 0.5) * cellHeight
      const lines = regionLabelLines(region.name.toUpperCase())
      const lineHeight = fontSize * 1.2
      const padding = 5
      const width = Math.max(...lines.map((line) => context.measureText(line).width)) + padding * 2
      const height = lines.length * lineHeight + padding * 2

      context.fillStyle = 'rgb(18 16 14 / 88%)'
      context.fillRect(x - width / 2, y - height / 2, width, height)
      context.strokeStyle = highlightedSourceIds.has(region.id) ? '#fef08a' : '#cc9a63'
      context.lineWidth = 1
      context.strokeRect(x - width / 2, y - height / 2, width, height)
      lines.forEach((line, index) => {
        context.fillStyle = '#efe4d2'
        context.fillText(
          line,
          x,
          y - (lines.length * lineHeight) / 2 + lineHeight / 2 + index * lineHeight,
        )
      })
    }
  }, [highlightedSourceIds, regionById, size])

  const regionAtPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    const bounds = boundsRef.current
    if (!canvas || !bounds) return null
    const rect = canvas.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    if (
      x < bounds.x
      || y < bounds.y
      || x >= bounds.x + bounds.width
      || y >= bounds.y + bounds.height
    ) return null

    const column = Math.floor(((x - bounds.x) / bounds.width) * regionMapData.columns)
    const row = Math.floor(((y - bounds.y) / bounds.height) * regionMapData.rows)
    return displayRegionId(
      regionMapData,
      regionMapData.pixels[row]?.[column] ?? null,
    )
  }, [])

  const handleMapIntent = () => {
    if (guidePrefetchAllowed()) void preloadDataTable().catch(() => {})
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    setHoveredRegionId(regionAtPoint(event.clientX, event.clientY))
  }

  const handleClick = (event: MouseEvent<HTMLCanvasElement>) => {
    const regionId = regionAtPoint(event.clientX, event.clientY)
    if (regionId) navigate(regionGuidePath(regionId))
  }

  return (
    <figure className="m-0! text-foreground">
      <div className="relative h-[clamp(20rem,62vw,44rem)] overflow-hidden">
        <canvas
          aria-hidden="true"
          className={hoveredRegionId ? 'block size-full cursor-pointer' : 'block size-full'}
          onClick={handleClick}
          onPointerEnter={handleMapIntent}
          onPointerLeave={() => setHoveredRegionId(null)}
          onPointerMove={handlePointerMove}
          ref={canvasRef}
        />
      </div>
      <figcaption className="grid grid-cols-[repeat(auto-fit,minmax(12rem,1fr))] gap-2 bg-transparent pt-3 max-[521px]:grid-cols-1">
        {regions.map((region) => (
          <Link
            className="group/map-link grid min-h-[3.25rem] min-w-0 grid-cols-[.8rem_minmax(0,1fr)_.9rem] items-center gap-[.65rem] border bg-transparent px-3 py-[.65rem] text-foreground no-underline transition-colors duration-150 hover:bg-accent hover:text-primary focus-visible:bg-accent focus-visible:text-primary"
            key={region.id}
            to={regionGuidePath(region.id)}
            onFocus={() => setHoveredRegionId(region.id)}
            onBlur={() => setHoveredRegionId(null)}
            onMouseEnter={() => setHoveredRegionId(region.id)}
            onMouseLeave={() => setHoveredRegionId(null)}
          >
            <span
              className="size-[.72rem] border border-[color-mix(in_srgb,var(--foreground)_35%,transparent)]"
              aria-hidden="true"
              style={{ backgroundColor: region.color ?? '#2a3a30' }}
            />
            <strong className="min-w-0 text-[.7rem] leading-[1.3] tracking-[.035em] uppercase">
              {region.name}
            </strong>
            <ArrowRight
              className="size-[.85rem] text-leagues-accent transition-transform duration-150 group-hover/map-link:translate-x-[.15rem]"
              aria-hidden="true"
            />
          </Link>
        ))}
      </figcaption>
    </figure>
  )
}
