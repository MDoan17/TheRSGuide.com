import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { BookOpen } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useGuideSearch } from '@/hooks/use-guide-search'

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
  const [query, setQuery] = useState('')
  const { searchIndex, searchLoading } = useGuideSearch(open && Boolean(query.trim()))
  const results = useMemo(() => {
    if (!query.trim()) return searchIndex.browse(14, pathScope)
    return searchIndex.search(query, 30, pathScope)
  }, [pathScope, query, searchIndex])

  const selectResult = (path: string) => {
    navigate(path)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="search-dialog">
        <DialogHeader>
          <DialogTitle className="sr-only">Search The RS Guide</DialogTitle>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Search every guide…"
          />
          <ScrollArea type="always" className="search-dialog-results">
            <CommandList className="search-dialog-list">
              <CommandEmpty>
                {searchLoading ? 'Loading guide search…' : 'No guide matched that search.'}
              </CommandEmpty>
              <CommandGroup heading={query ? 'Results' : 'Browse guides'}>
                {results.map(({ document, sectionLabel }) => (
                  <CommandItem
                    key={document.path}
                    value={document.path}
                    onSelect={() => selectResult(document.path)}
                  >
                    <BookOpen />
                    <div>
                      <strong>{document.title}</strong>
                      <span>
                        {sectionLabel}
                        {document.description ? ` · ${document.description}` : ''}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
