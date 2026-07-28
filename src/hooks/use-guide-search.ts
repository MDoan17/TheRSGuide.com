import { useEffect, useState } from 'react'
import { guideSearch, loadGuideSearch } from '@/lib/content'

export function useGuideSearch(active: boolean) {
  const [searchIndex, setSearchIndex] = useState(guideSearch)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    setSearchLoading(true)
    void loadGuideSearch()
      .then((index) => {
        if (!cancelled) setSearchIndex(index)
      })
      .catch(() => {
        // Keep the metadata-only search available if the optional corpus chunk fails.
      })
      .finally(() => {
        if (!cancelled) setSearchLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active])

  return { searchIndex, searchLoading }
}
