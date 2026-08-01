import { Fragment, lazy, Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, BookOpen, LoaderCircle, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { SiteSettingsButton } from '@/components/cookie-consent'
import { LeaguesCountdown } from '@/components/leagues-countdown'
import { useGuideSearch } from '@/hooks/use-guide-search'
import { homepagePrimaryLinks } from '@/lib/homepage-mode'
import { usePageMetadata } from '@/lib/page-metadata'
import { cn } from '@/lib/utils'

const HomeBackgroundMedia = lazy(() => import('@/components/home-background-media').then((module) => ({
  default: module.HomeBackgroundMedia,
})))

function HomeBackground({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<main className="home home-search-page">{children}</main>}>
      <HomeBackgroundMedia>{children}</HomeBackgroundMedia>
    </Suspense>
  )
}

function HomeSearch({
  pathScope,
  playerLookup = true,
  placeholder = 'Search a topic or username',
  ariaLabel = 'Search a topic or username',
}: {
  pathScope?: string
  playerLookup?: boolean
  placeholder?: string
  ariaLabel?: string
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const needle = query.toLowerCase().trim()
  const { searchIndex, searchLoading } = useGuideSearch(Boolean(needle))
  const results = useMemo(() => {
    if (!needle) return []
    return searchIndex.search(query, 8, pathScope)
  }, [needle, pathScope, query, searchIndex])
  const usernameCandidate = query.trim()
  const canLookupPlayer = playerLookup
    && usernameCandidate.length > 0
    && usernameCandidate.length <= 12
    && /^[a-z0-9 _-]+$/i.test(usernameCandidate)

  return (
    <Command
      shouldFilter={false}
      className="home-search-command"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          setResultsOpen(false)
        }
      }}
    >
      <CommandInput
        data-home-search
        value={query}
        onValueChange={(value) => {
          setQuery(value)
          setResultsOpen(Boolean(value.trim()))
        }}
        onFocus={() => {
          if (needle) setResultsOpen(true)
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {needle && resultsOpen && (
        <CommandList className="home-search-results">
          {canLookupPlayer && (
            <CommandGroup heading="Player results">
              <CommandItem
                value={`player-${usernameCandidate}`}
                className="home-player-result"
                onSelect={() => navigate(`/guides/skill-training?username=${encodeURIComponent(usernameCandidate)}`)}
              >
                <Card size="sm">
                  <CardContent>
                    <span className="home-player-icon"><UserRound /></span>
                    <span className="home-player-copy">
                      <strong>{usernameCandidate}</strong>
                      <span>View skill recommendations</span>
                    </span>
                    <ArrowRight />
                  </CardContent>
                </Card>
              </CommandItem>
            </CommandGroup>
          )}
          {results.length ? (
            <CommandGroup heading="Guide results">
              {results.map(({ document, excerpt, sectionLabel }) => (
                <CommandItem
                  key={document.path}
                  value={document.path}
                  onSelect={() => navigate(document.path)}
                >
                  <BookOpen />
                  <div className="home-search-result-copy">
                    <strong>{document.title}</strong>
                    <span>{excerpt}</span>
                  </div>
                  <small>{sectionLabel}</small>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandEmpty>
              {searchLoading ? (
                <LoaderCircle className="search-loading-icon" aria-label="Loading guide search" />
              ) : (
                <>
                  <strong>No guide found for “{query.trim()}”</strong>
                  <span>
                    {playerLookup
                      ? 'Try another topic or a RuneScape username.'
                      : 'Try another Leagues topic.'}
                  </span>
                </>
              )}
            </CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  )
}

type LandingLink = {
  label: string
  to: string
  highlighted?: boolean
}

function LandingPage({
  variant,
  title,
  primaryLinks,
  secondaryLabel,
  secondaryLinks = [],
  search,
  spotlight,
  backLink,
}: {
  variant: 'evergreen' | 'leagues'
  title: ReactNode
  primaryLinks: readonly LandingLink[]
  secondaryLabel?: string
  secondaryLinks?: readonly LandingLink[]
  search?: {
    pathScope?: string
    playerLookup?: boolean
    placeholder?: string
    ariaLabel?: string
  }
  spotlight?: ReactNode
  backLink?: LandingLink
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.classList.add('home-page')
    return () => document.documentElement.classList.remove('home-page')
  }, [])

  return (
    <HomeBackground>
      <>
        <section className={cn('home-search-landing', `home-search-landing-${variant}`)}>
          <div className="home-search-intro">
            <h1>{title}</h1>
          </div>
          {spotlight ?? <HomeSearch {...search} />}
          <nav className="home-primary-links" aria-label="Main guide sections">
            {primaryLinks.map((link) => (
              <Button
                key={link.to}
                size="lg"
                variant={link.highlighted ? 'default' : 'outline'}
                className={link.to === '/leagues' ? 'home-leagues-link' : undefined}
                asChild
              >
                <Link to={link.to}>{link.label}</Link>
              </Button>
            ))}
          </nav>
          {secondaryLinks.length > 0 && (
            <nav className="home-combat-links" aria-label={secondaryLabel}>
              {secondaryLinks.map((link, index) => (
                <Fragment key={link.to}>
                  {index > 0 && <span aria-hidden="true">/</span>}
                  <Link to={link.to}>{link.label}</Link>
                </Fragment>
              ))}
            </nav>
          )}
        </section>
        {backLink && (
          <Button variant="outline" size="sm" className="home-back-link" asChild>
            <Link to={backLink.to}>
              <ArrowLeft />
              {backLink.label}
            </Link>
          </Button>
        )}
        <SiteSettingsButton
          className="home-settings"
          label="Open homepage settings"
        />
      </>
    </HomeBackground>
  )
}

const evergreenCombatLinks: readonly LandingLink[] = [
  { label: 'Melee', to: '/guides/melee' },
  { label: 'Ranged', to: '/guides/range' },
  { label: 'Magic', to: '/guides/magic' },
  { label: 'Necromancy', to: '/guides/necromancy' },
]

export function HomePage() {
  usePageMetadata({
    path: '/',
    title: 'The RS Guide | Practical RuneScape Guides',
    description: 'Practical RuneScape guides for combat, progression, setup, and account planning.',
    image: '/og/home.png',
    imageAlt: 'The RS Guide homepage preview',
  })

  return (
    <LandingPage
      variant="evergreen"
      title={<>The <span>RS</span> Guide</>}
      primaryLinks={homepagePrimaryLinks(import.meta.env.VITE_HOMEPAGE_MODE)}
      secondaryLabel="Combat style guides"
      secondaryLinks={evergreenCombatLinks}
    />
  )
}

const leaguesPrimaryLinks: readonly LandingLink[] = [
  { label: 'Leagues II', to: '/leagues/leagues-ii', highlighted: true },
  { label: 'RS for OS', to: '/leagues/rs-for-os-players' },
  { label: 'Regions', to: '/leagues/map' },
]

export function LeaguesHomePage() {
  usePageMetadata({
    path: '/leagues',
    title: 'RuneScape Leagues Guide | The RS Guide',
    description: 'RuneScape Leagues guides for relics, blessings, regions, routes, skilling, and players coming from Old School RuneScape.',
    image: '/og/leagues.png',
    imageAlt: 'The RuneScape Leagues Guide homepage preview',
  })

  return (
    <LandingPage
      variant="leagues"
      title={<>The <span>Leagues</span> Guide</>}
      primaryLinks={leaguesPrimaryLinks}
      spotlight={<LeaguesCountdown />}
      backLink={{ label: 'Back to Main Site', to: '/' }}
    />
  )
}
