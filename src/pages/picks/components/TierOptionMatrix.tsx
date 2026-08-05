import { Check, Crown } from 'lucide-react'
import { Fragment, useState, type ReactElement } from 'react'

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type TierOptionMatrixVariant = 'blessing' | 'relic'

export type TierOptionMatrixTier = {
  isSelected?: boolean
  isSpecial?: boolean
  tier: number
}

export type TierOptionMatrixCell = {
  ariaLabel: string
  backgroundColor?: string
  description: string
  detailsAriaLabel?: string
  fallback: string
  id: string
  image?: string
  isSelected: boolean
  label: string
  onViewDetails?: () => void
  onSelect?: () => void
  readOnly?: boolean
  statusLabel?: string
}

export type TierOptionMatrixRow = {
  cells: Array<TierOptionMatrixCell | null>
  id: string
}

type TierOptionMatrixProps = {
  ariaLabel: string
  className?: string
  rows: TierOptionMatrixRow[]
  tiers: TierOptionMatrixTier[]
  variant: TierOptionMatrixVariant
}

function MatrixCell({
  cell,
  isSpecial,
  isLastRow,
  variant,
}: {
  cell: TierOptionMatrixCell
  isSpecial: boolean
  isLastRow: boolean
  variant: TierOptionMatrixVariant
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const isBlessing = variant === 'blessing'
  const isInteractive = !cell.readOnly && Boolean(cell.onSelect)
  const cellStyle = isBlessing
    ? { backgroundColor: cell.backgroundColor }
    : undefined
  const cellClassName = cn(
    'group relative flex w-full touch-manipulation select-none flex-col items-center',
    cell.onViewDetails
      ? 'min-h-28 flex-1 justify-end gap-0.5 px-2 pt-2 pb-1'
      : 'h-full min-h-36 justify-center gap-2 px-2 py-3',
    isBlessing && 'text-white',
    isBlessing &&
      isInteractive &&
      'transition-[filter,outline-color] duration-150 hover:brightness-125',
    isBlessing &&
      !isInteractive &&
      'focus-visible:z-20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
    isBlessing &&
      isInteractive &&
      'focus-visible:z-20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
    !isBlessing &&
      'transition-colors duration-150 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
    !isBlessing &&
      (cell.isSelected
        ? 'bg-primary text-primary-foreground'
        : 'bg-card/60 text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground'),
  )
  const contentOpacityClassName =
    isBlessing && !cell.isSelected
      ? 'opacity-25 group-hover:opacity-60'
      : 'opacity-100'

  const content = (
    <>
      {cell.isSelected && (
        <Check
          aria-hidden
          className={cn(
            'absolute top-2 right-2',
            isBlessing ? 'size-2.5' : 'size-3',
          )}
        />
      )}
      <span
        className={cn(
          'flex w-full items-center justify-center',
          'h-20',
        )}
      >
        {cell.image ? (
          <img
            alt=""
            aria-hidden
            className={cn(
              'w-auto max-w-full object-contain transition-opacity',
              'h-20',
              !cell.isSelected &&
                (isBlessing
                  ? 'opacity-40 group-hover:opacity-75'
                  : 'opacity-65 group-hover:opacity-100 group-active:opacity-100'),
            )}
            draggable={false}
            height={100}
            src={cell.image}
            width={100}
          />
        ) : (
          <span
            className={cn(
              'font-black leading-none transition-opacity',
              isBlessing ? 'text-2xl' : 'text-2xl',
              contentOpacityClassName,
            )}
          >
            {cell.fallback}
          </span>
        )}
      </span>
      <span
        className={cn(
          'flex min-h-5 items-center justify-center text-center font-black uppercase leading-tight transition-opacity',
          isBlessing
            ? 'px-1 text-[9px] tracking-[0.04em]'
            : 'text-[9px] tracking-[0.1em]',
          isBlessing
            ? contentOpacityClassName
            : cell.isSelected
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground group-hover:text-accent-foreground/70 group-active:text-accent-foreground/70',
        )}
      >
        {cell.statusLabel ?? cell.label}
      </span>
    </>
  )

  let trigger: ReactElement
  if (isInteractive) {
    trigger = (
      <button
        aria-label={cell.ariaLabel}
        aria-pressed={cell.isSelected}
        className={cellClassName}
        onClick={cell.onSelect}
        style={cellStyle}
        type="button"
      >
        {content}
      </button>
    )
  } else {
    trigger = (
      <div
        aria-label={cell.ariaLabel}
        className={cellClassName}
        style={cellStyle}
        tabIndex={0}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex flex-col border-r border-b border-border',
        isSpecial && 'border-x-2 border-x-primary/70',
        isBlessing &&
          cell.isSelected &&
          'z-10 outline-2 -outline-offset-2 outline-primary',
      )}
      style={cellStyle}
    >
      <Tooltip open={isTooltipOpen}>
        <TooltipTrigger
          asChild
          onBlur={() => setIsTooltipOpen(false)}
          onFocus={(event) => {
            if (event.currentTarget.matches(':focus-visible')) {
              setIsTooltipOpen(true)
            }
          }}
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') {
              setIsTooltipOpen(true)
            }
          }}
          onPointerLeave={() => setIsTooltipOpen(false)}
        >
          {trigger}
        </TooltipTrigger>
        <TooltipContent
          className="w-56 items-start border border-border bg-popover p-4 text-left shadow-xl ring-0"
          side={isLastRow ? 'bottom' : 'top'}
          sideOffset={10}
        >
          <div className="flex w-full flex-col gap-2">
            <p className="font-display text-base font-semibold text-popover-foreground">
              {cell.label}
            </p>
            <p className="border-t pt-2 text-xs leading-5 text-muted-foreground">
              {cell.description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
      {cell.onViewDetails && (
        <button
          aria-label={cell.detailsAriaLabel ?? `View details for ${cell.statusLabel ?? cell.label}`}
          className="mx-2 mb-2 flex h-9 items-center justify-center rounded-md border border-primary/70 bg-card/80 px-3 text-[10px] font-bold uppercase leading-none tracking-[0.1em] text-card-foreground shadow-sm transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
          onClick={(event) => {
            event.currentTarget.blur()
            cell.onViewDetails?.()
          }}
          type="button"
        >
          Details
        </button>
      )}
    </div>
  )
}

function TierHeader({
  frameSpecial = true,
  mobileRail = false,
  tier: { isSelected, isSpecial, tier },
  variant,
}: {
  frameSpecial?: boolean
  mobileRail?: boolean
  tier: TierOptionMatrixTier
  variant: TierOptionMatrixVariant
}) {
  return (
    <div
      className={cn(
        'relative flex min-h-16 flex-col items-center justify-center border-r border-b border-border pt-2 pb-1 text-muted-foreground',
        variant === 'relic' &&
          isSelected &&
          'bg-primary/[0.08] text-primary',
        isSpecial && 'bg-primary/[0.08] text-primary',
        isSpecial && frameSpecial && 'border-x-2 border-x-primary/70',
      )}
    >
      {mobileRail ? (
        <span className="rotate-180 whitespace-nowrap text-[8px] font-black uppercase tracking-[0.18em] [writing-mode:vertical-rl]">
          {isSpecial ? `God Tier ${tier}` : `Tier ${tier}`}
        </span>
      ) : (
        <>
          {isSpecial && <Crown aria-hidden className="mb-0.5 size-3" />}
          <span className="text-xl font-black leading-none">{tier}</span>
          <span className="mt-1 text-[7px] font-black uppercase tracking-[0.12em]">
            {isSpecial ? 'God Tier' : 'Tier'}
          </span>
        </>
      )}
    </div>
  )
}

export function TierOptionMatrix({
  ariaLabel,
  className,
  rows,
  tiers,
  variant,
}: TierOptionMatrixProps) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn('mt-4 pb-1 md:overflow-x-auto', className)}
    >
      <div className="border-t border-l border-border bg-card/20 md:hidden">
        {tiers.map((tier, tierIndex) => (
          <section
            className={cn(
              'grid',
              tier.isSpecial &&
                'relative z-10 outline-2 -outline-offset-2 outline-primary/70',
            )}
            key={tier.tier}
            style={{
              gridTemplateColumns: `2.5rem repeat(${rows.filter((row) => row.cells[tierIndex]).length}, minmax(0, 1fr))`,
            }}
          >
            <TierHeader
              frameSpecial={false}
              mobileRail
              tier={tier}
              variant={variant}
            />
            {rows.flatMap((row) => {
              const cell = row.cells[tierIndex]
              return cell ? [
                <MatrixCell
                  cell={cell}
                  isLastRow={false}
                  isSpecial={false}
                  key={row.id}
                  variant={variant}
                />,
              ] : []
            })}
          </section>
        ))}
      </div>

      <div
        className="hidden min-w-[54rem] border-t border-l border-border bg-card/20 md:grid"
        style={{
          gridTemplateColumns: `repeat(${tiers.length}, minmax(6.75rem, 1fr))`,
        }}
      >
        {tiers.map((tier) => (
          <TierHeader
            key={tier.tier}
            tier={tier}
            variant={variant}
          />
        ))}

        {rows.map((row, rowIndex) => (
          <Fragment key={row.id}>
            {row.cells.map((cell, tierIndex) =>
              cell ? (
                <MatrixCell
                  cell={cell}
                  isLastRow={rowIndex === rows.length - 1}
                  isSpecial={Boolean(tiers[tierIndex]?.isSpecial)}
                  key={cell.id}
                  variant={variant}
                />
              ) : (
                <div
                  aria-hidden
                  className="border-r border-b border-border bg-muted/25"
                  key={`empty-${tiers[tierIndex]?.tier}`}
                />
              ),
            )}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
