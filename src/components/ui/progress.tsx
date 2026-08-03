import * as React from "react"

import { cn } from "@/lib/utils"

function Progress({
  className,
  max = 100,
  value = 0,
  ...props
}: React.ComponentProps<"div"> & { max?: number; value?: number }) {
  const safeMax = Math.max(1, max)
  const percentage = Math.min(100, Math.max(0, (value / safeMax) * 100))

  return (
    <div
      aria-valuemax={safeMax}
      aria-valuemin={0}
      aria-valuenow={value}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress }
