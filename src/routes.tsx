import { lazy, Suspense } from 'react'
import { Link, Route, Routes } from 'react-router'
import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlayerDataProvider } from '@/features/player/player-data-context'
import { guideCatalog } from '@/lib/content'
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

export function AppRoutes() {
  return (
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
  )
}
