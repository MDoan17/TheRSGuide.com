import { useNavigate } from 'react-router'
import { GuideSearchResult } from '@/components/search/guide-search-result'
import { useGuideSearchSession } from '@/components/search/use-guide-search-session'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

export function GuideSearchDialog({
  open,
  onOpenChange,
  pathScope,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  pathScope?: string
}) {
  const navigate = useNavigate()
  const { query, setQuery, results, loading } = useGuideSearchSession({
    active: open,
    pathScope,
    browseLimit: 14,
    searchLimit: 30,
  })

  const selectResult = (path: string) => {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(36rem,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden p-0 sm:max-w-none">
        <DialogHeader>
          <DialogTitle className="sr-only">Search The RS Guide</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            wrapperClassName="px-2 pt-2 pb-1"
            placeholder="Search every guideâ€¦"
          />
          <ScrollArea
            type="always"
            className="h-[min(28rem,calc(100svh-12rem))]"
            thumbClassName="bg-[color-mix(in_oklch,var(--muted-foreground)_55%,transparent)]"
          >
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty>
                {loading ? 'Loading guide searchâ€¦' : 'No guide matched that search.'}
              </CommandEmpty>
              <CommandGroup
                className="py-[.45rem]"
                heading={query ? 'Results' : 'Browse guides'}
              >
                {results.map((hit) => (
                  <GuideSearchResult
                    key={hit.document.path}
                    hit={hit}
                    display="dialog"
                    onSelect={selectResult}
                  />
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
