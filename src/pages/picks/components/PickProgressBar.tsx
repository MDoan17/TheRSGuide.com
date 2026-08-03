import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

type PickProgressBarProps = {
  className?: string
  label: string
  max: number
  value: number
}

export function PickProgressBar({
  className,
  label,
  max,
  value,
}: PickProgressBarProps) {
  return (
    <div className={cn('h-1.5 w-full', className)}>
      <Progress aria-label={label} max={max} value={value} />
    </div>
  )
}


