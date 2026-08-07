import { X } from 'lucide-react'

import type { BlessingItem } from '@/components/mdx/blessing-display'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'

type PickerBlessingDetailsDrawerProps = {
  blessing: BlessingItem | null
  onOpenChange: (open: boolean) => void
}

export function PickerBlessingDetailsDrawer({
  blessing,
  onOpenChange,
}: PickerBlessingDetailsDrawerProps) {
  return (
    <Drawer
      direction="bottom"
      open={Boolean(blessing)}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="h-[75dvh] max-h-[75dvh] overflow-hidden">
        {blessing && (
          <>
            <DrawerClose
              aria-label="Close blessing details"
              className="absolute top-4 right-5 z-10 flex size-11 items-center justify-center rounded-full border border-border bg-popover/95 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:top-6 sm:right-8"
              type="button"
            >
              <X aria-hidden className="size-5" />
            </DrawerClose>

            <div className="picker-details-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="mx-auto w-full max-w-6xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-8">
                <DrawerHeader className="flex-row items-start gap-4 px-0 py-5 pr-14 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left sm:items-center sm:gap-6 sm:py-6 sm:pr-16">
                  {blessing.image && (
                    <img
                      alt=""
                      aria-hidden
                      className="size-20 shrink-0 object-contain sm:size-28"
                      height={112}
                      src={blessing.image}
                      width={112}
                    />
                  )}
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-primary sm:text-sm">
                      Tier {blessing.tier} {blessing.path} blessing
                    </p>
                    <DrawerTitle className="font-display text-3xl font-semibold leading-none sm:text-4xl">
                      {blessing.name}
                    </DrawerTitle>
                    <DrawerDescription className="max-w-4xl text-base leading-6 text-muted-foreground sm:text-xl sm:leading-8">
                      {blessing.tagline}
                    </DrawerDescription>
                  </div>
                </DrawerHeader>

                <div className="border-t border-border py-6 sm:py-8">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)] lg:gap-12">
                    <section
                      className={cn(
                        !blessing.notes.length && 'lg:col-span-2',
                      )}
                    >
                      <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                        Effects
                      </h3>
                      <ul className="mt-5 space-y-4 text-base leading-7 text-foreground sm:mt-6 sm:space-y-5 sm:text-lg sm:leading-8">
                        {blessing.effects.map((effect, effectIndex) => (
                          <li
                            className="grid grid-cols-[0.5rem_1fr] items-start gap-4"
                            key={effectIndex}
                          >
                            <span
                              aria-hidden
                              className="mt-[0.7rem] size-2 rounded-full bg-primary sm:mt-3"
                            />
                            <span>{effect}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {blessing.notes.length > 0 && (
                      <section className="border-t border-border pt-7 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                        <h3 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
                          Notes
                        </h3>
                        <ul className="mt-5 space-y-4 text-base leading-7 text-muted-foreground sm:mt-6 sm:space-y-5 sm:text-lg sm:leading-8">
                          {blessing.notes.map((note, noteIndex) => (
                            <li
                              className="grid grid-cols-[0.5rem_1fr] items-start gap-4"
                              key={noteIndex}
                            >
                              <span
                                aria-hidden
                                className="mt-[0.7rem] size-2 rounded-full bg-muted-foreground/60 sm:mt-3"
                              />
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}
