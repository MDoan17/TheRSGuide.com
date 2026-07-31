import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { CookieConsent } from '@/components/cookie-consent'
import { GuideSearchDialog } from '@/components/guide-search-dialog'
import { SiteHeader } from '@/components/site-header'
import { TooltipProvider } from '@/components/ui/tooltip'
import { guideCatalog, isLeaguesRoute } from '@/lib/content'
import { AppRoutes } from '@/routes'

function App() {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const normalizedPathname = pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
  const isLandingPage = normalizedPathname === '/' || normalizedPathname === '/leagues'
  const leaguesRoute = isLeaguesRoute(pathname)
  const hasGuideSidebar = guideCatalog.documents.some((doc) => doc.path === pathname)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (normalizedPathname === '/') {
          event.preventDefault()
          document.querySelector<HTMLInputElement>('[data-home-search]')?.focus()
        } else if (normalizedPathname !== '/leagues') {
          event.preventDefault()
          setSearchOpen(true)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [normalizedPathname])

  return (
    <TooltipProvider>
      <CookieConsent>
        {!isLandingPage && (
          <SiteHeader
            openSearch={() => setSearchOpen(true)}
            showSettings={!hasGuideSidebar}
          />
        )}
        <AppRoutes />
        <GuideSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          pathScope={leaguesRoute ? '/leagues' : undefined}
        />
      </CookieConsent>
    </TooltipProvider>
  )
}

export default App
