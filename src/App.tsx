import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { CookieConsent } from '@/components/cookie-consent'
import { GuideSearchDialog } from '@/components/guide-search-dialog'
import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { PlayerDataProvider } from '@/features/player/player-data-context'
import { guideCatalog, isLeaguesRoute } from '@/lib/content'
import { usePageMetadata } from '@/lib/page-metadata'
import { GuidePage } from '@/pages/guide-page'
import { HomePage, LeaguesHomePage } from '@/pages/home-page'

const PlayerPage = lazy(() => import('@/pages/player-page').then((module) => ({
  default: module.PlayerPage,
})))

function NotFoundPage() {
  usePageMetadata({
    path: '/404',
    title: 'Guide Not Found | The RS Guide',
    description: 'The requested RuneScape guide could not be found.',
    image: '/og/home.png',
    imageAlt: 'The RS Guide homepage preview',
  })

  return (
    <main className="not-found">
      <p className="eyebrow">Lost in Gielinor</p>
      <h1>That guide hasn’t been written.</h1>
      <Button asChild><Link to="/">Return home</Link></Button>
    </main>
  )
}

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leagues" element={<LeaguesHomePage />} />
          <Route
            path="/extras/player"
            element={(
              <PlayerDataProvider>
                <Suspense
                  fallback={(
                    <div
                      className="guide-loading"
                      role="status"
                      aria-label="Loading player progression"
                    >
                      <LoaderCircle />
                    </div>
                  )}
                >
                  <PlayerPage />
                </Suspense>
              </PlayerDataProvider>
            )}
          />
          {guideCatalog.documents
            .filter((doc) => doc.path !== '/leagues')
            .map((doc) => (
              <Route key={doc.path} path={doc.path} element={<GuidePage doc={doc} />} />
            ))}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
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
