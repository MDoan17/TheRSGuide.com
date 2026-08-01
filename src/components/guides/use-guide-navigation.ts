import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"

import { guideSectionsForPath, isLeaguesRoute } from "@/lib/content"
import {
  createGuideNavigationModel,
  type GuideNavigationModel,
} from "@/lib/guide-navigation"

type GuideNavigationViewModel = GuideNavigationModel & {
  setOpen: (key: string, open: boolean) => void
}

function useGuideNavigation(): GuideNavigationViewModel {
  const { pathname } = useLocation()
  const sections = guideSectionsForPath(pathname)
  const flattened = isLeaguesRoute(pathname)
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() =>
    createGuideNavigationModel({
      sections,
      pathname,
      expanded: new Set(),
      flattened,
      syncActive: true,
    }).expanded
  )

  useEffect(() => {
    setExpanded(
      (current) =>
        createGuideNavigationModel({
          sections,
          pathname,
          expanded: current,
          flattened,
          syncActive: true,
        }).expanded
    )
  }, [flattened, pathname, sections])

  const model = useMemo(
    () =>
      createGuideNavigationModel({
        sections,
        pathname,
        expanded,
        flattened,
      }),
    [expanded, flattened, pathname, sections]
  )

  return {
    ...model,
    setOpen: (key, open) => {
      setExpanded((current) => {
        if (current.has(key) === open) return current
        const next = new Set(current)
        if (open) next.add(key)
        else next.delete(key)
        return next
      })
    },
  }
}

export { useGuideNavigation, type GuideNavigationViewModel }
