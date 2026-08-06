import type { PropsWithChildren } from "react"
import { useLocation } from "react-router"

import { FailoverNotice } from "@/components/site/failover-notice"
import { SiteHeader } from "@/components/site/site-header"
import { useLinkPrefetch } from "@/hooks/use-link-prefetch"
import { guideCatalog } from "@/lib/content"

function SiteShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation()

  useLinkPrefetch()

  const normalizedPathname =
    pathname === "/" ? pathname : pathname.replace(/\/+$/, "")
  const isLandingPage = normalizedPathname === "/"
  const hasGuideSidebar = guideCatalog.documents.some(
    (doc) => doc.path === pathname
  )

  return (
    <>
      <FailoverNotice />
      {!isLandingPage && <SiteHeader showSettings={!hasGuideSidebar} />}
      {children}
    </>
  )
}

export { SiteShell }
