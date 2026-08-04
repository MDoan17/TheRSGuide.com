import type { ReactNode } from 'react'
import { Construction } from 'lucide-react'

import { proseFlowClassName } from '@/components/mdx/prose'
import { cn } from '@/lib/utils'

interface UnderConstructionProps {
  children?: ReactNode
}

export function UnderConstruction({ children }: UnderConstructionProps) {
  const hasContent = children != null

  return (
    <section>
      <div className="flex min-h-32 items-center justify-center gap-3 border border-border bg-card/50 px-6 py-6 text-center">
        <Construction aria-hidden="true" className="size-7 shrink-0 text-primary" strokeWidth={1.5} />
        <p className="m-0 font-display text-xl font-semibold text-foreground sm:text-2xl">
          {hasContent ? 'This page is currently under construction.' : 'Pages under construction'}
        </p>
      </div>

      {hasContent && (
        <div className={cn(proseFlowClassName, 'mt-10')}>
          {children}
        </div>
      )}
    </section>
  )
}
