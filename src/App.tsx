import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Command as CommandIcon, LoaderCircle, Menu, Moon, Search, Sun, UserRound } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent } from '@/components/ui/card'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { guideCatalog, type Doc } from '@/lib/content'
import { mdxComponents } from '@/mdx_components/mdx-components'
import { PlayerDataProvider } from '@/features/player/player-data-context'
import { CookieConsent, SiteSettingsButton } from '@/components/cookie-consent'
import {
  GuideSidebar,
  GuideSidebarExpandTrigger,
  MobileGuideNavigation,
} from '@/components/guide-navigation'
import { cn } from '@/lib/utils'
import { useGuideSearch } from '@/hooks/use-guide-search'
import { openGraphImagePath, usePageMetadata } from '@/lib/page-metadata'
import { functionalStorageAllowed } from '@/lib/privacy-preferences'

const PlayerPage = lazy(() => import('@/pages/player-page').then((module) => ({
  default: module.PlayerPage,
})))
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

function Logo() {
  return (
    <Link to="/" className="brand-mark" aria-label="The RS Guide home">
      The RS Guide
    </Link>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    if (!functionalStorageAllowed()) window.localStorage.removeItem('theme')
  }
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle color theme">
      {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}

function SearchButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <Button variant="outline" size={compact ? 'icon' : 'default'} onClick={onClick} className={cn(!compact && 'search-button')}>
      <Search data-icon="inline-start" />
      {!compact && <><span>Search guides</span><kbd><CommandIcon /> K</kbd></>}
    </Button>
  )
}

function SearchDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const { searchIndex, searchLoading } = useGuideSearch(open && Boolean(query.trim()))
  const results = useMemo(() => {
    if (!query.trim()) return searchIndex.browse(14)
    return searchIndex.search(query, 30)
  }, [query, searchIndex])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="search-dialog">
        <DialogHeader><DialogTitle className="sr-only">Search The RS Guide</DialogTitle></DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search every guide…" />
          <ScrollArea type="always" className="search-dialog-results">
            <CommandList className="search-dialog-list">
              <CommandEmpty>
                {searchLoading ? 'Loading guide search…' : 'No guide matched that search.'}
              </CommandEmpty>
              <CommandGroup heading={query ? 'Results' : 'Browse guides'}>
                {results.map(({ document, sectionLabel }) => (
                  <CommandItem key={document.path} value={document.path} onSelect={() => { navigate(document.path); setOpen(false) }}>
                    <BookOpen />
                    <div><strong>{document.title}</strong><span>{sectionLabel}{document.description ? ` · ${document.description}` : ''}</span></div>
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

function Header({
  openSearch,
  showSettings,
}: {
  openSearch: () => void
  showSettings: boolean
}) {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="top-nav" aria-label="Primary navigation">
          {guideCatalog.sections.map((section) => <NavLink key={section.id} to={section.path}>{section.label}</NavLink>)}
        </nav>
        <div className="header-actions">
          {pathname !== '/' && <SearchButton onClick={openSearch} />}
          <ThemeToggle />
          {showSettings && <SiteSettingsButton label="Open site settings" />}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="mobile-menu"><Menu /><span className="sr-only">Open menu</span></Button></SheetTrigger>
            <SheetContent side="left" className="mobile-sheet">
              <SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader>
              <ScrollArea className="mobile-sidebar-scroll">
                <MobileGuideNavigation close={() => setMobileOpen(false)} />
              </ScrollArea>
              <div className="mobile-sidebar-footer">
                <SiteSettingsButton
                  className="mobile-sidebar-settings"
                  label="Open site settings"
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function Breadcrumbs({ doc }: { doc: Doc }) {
  const breadcrumbs = guideCatalog.breadcrumbs(doc.path)
  return (
    <div className="breadcrumbs">
      <Link to="/">Home</Link>
      {breadcrumbs.map((breadcrumb) => (
        <span key={breadcrumb.path}>
          <ChevronRight />
          {breadcrumb.current ? <b>{breadcrumb.label}</b> : <Link to={breadcrumb.path}>{breadcrumb.label}</Link>}
        </span>
      ))}
    </div>
  )
}

function TableOfContents({ doc }: { doc: Doc }) {
  const { pathname } = useLocation()
  const [items, setItems] = useState(doc.tableOfContents)
  const [activeId, setActiveId] = useState('')
  const progressRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const article = document.querySelector('.guide-prose')
    const update = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>('.guide-prose h2, .guide-prose h3'))
      const renderedItems = headings.map((heading, index) => {
        if (!heading.id) heading.id = `${heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section'}-${index}`
        return {
          id: heading.id,
          text: heading.textContent || '',
          level: Number(heading.tagName.slice(1)) as 2 | 3,
        }
      })
      setItems(renderedItems.length ? renderedItems : doc.tableOfContents)
    }
    setItems(doc.tableOfContents)
    update()
    const observer = new MutationObserver(update)
    if (article) observer.observe(article, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [doc, pathname])

  useEffect(() => {
    if (!items.length) return

    let frame = 0
    const updateProgress = () => {
      frame = 0
      const headings = items
        .map((item) => document.getElementById(item.id))
        .filter((heading): heading is HTMLElement => Boolean(heading))
      if (!headings.length) return

      const readingPosition = window.scrollY + Math.min(window.innerHeight * 0.3, 240)
      const headingPositions = headings.map((heading) => heading.getBoundingClientRect().top + window.scrollY)
      const isAtPageEnd = window.scrollY > 0
        && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2
      let activeIndex = 0

      if (isAtPageEnd) {
        activeIndex = headings.length - 1
      } else {
        for (let index = 1; index < headingPositions.length; index += 1) {
          if (headingPositions[index] > readingPosition) break
          activeIndex = index
        }
      }

      const currentPosition = headingPositions[activeIndex]
      const nextPosition = headingPositions[activeIndex + 1]
      const sectionProgress = isAtPageEnd
        ? 0
        : nextPosition
        ? Math.min(Math.max((readingPosition - currentPosition) / (nextPosition - currentPosition), 0), 1)
        : 0
      const progress = isAtPageEnd
        ? 1
        : Math.min((activeIndex + sectionProgress + 1) / headings.length, 1)

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleY(${progress})`
      }
      setActiveId((current) => current === headings[activeIndex].id ? current : headings[activeIndex].id)
    }

    const scheduleProgressUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', scheduleProgressUpdate, { passive: true })
    window.addEventListener('resize', scheduleProgressUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', scheduleProgressUpdate)
      window.removeEventListener('resize', scheduleProgressUpdate)
    }
  }, [items])

  if (!doc.hasTableOfContents && !items.length) return null
  return (
    <aside className="toc">
      <ScrollArea className="toc-scroll">
        <nav className="toc-content" aria-labelledby="toc-title">
          <span ref={progressRef} className="toc-progress" aria-hidden="true" />
          <p id="toc-title">On this page</p>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <a
                  className={cn(item.level === 3 && 'toc-nested', activeId === item.id && 'toc-active')}
                  href={`#${item.id}`}
                  aria-current={activeId === item.id ? 'location' : undefined}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>
    </aside>
  )
}

function PrevNext({ doc }: { doc: Doc }) {
  const { previous, next } = guideCatalog.adjacent(doc)
  return (
    <div className="prev-next">
      {previous ? <Link to={previous.path}><ChevronLeft /><span><small>Previous</small>{previous.title}</span></Link> : <span />}
      {next && <Link to={next.path}><span><small>Next</small>{next.title}</span><ChevronRight /></Link>}
    </div>
  )
}

function DocPage({ doc }: { doc: Doc }) {
  const socialSection = guideCatalog
    .breadcrumbs(doc.path)
    .slice(0, -1)
    .at(-1)?.label ?? guideCatalog.sectionLabel(doc.section)
  usePageMetadata({
    path: doc.path,
    title: `${doc.title} | The RS Guide`,
    description: doc.description || `Read ${doc.title} on The RS Guide.`,
    image: doc.ogImage || openGraphImagePath(doc.path),
    imageAlt: `${doc.title} guide preview`,
    type: 'article',
    section: socialSection,
    tags: ['RuneScape', socialSection, 'Guide'],
  })
  useEffect(() => { window.scrollTo(0, 0) }, [doc])
  const sidebarDefaultOpen = !functionalStorageAllowed()
    || !document.cookie.includes('sidebar_state=false')
  const guideContent = (
    <MDXProvider components={mdxComponents}>
      <Suspense
        fallback={(
          <div className="guide-loading" role="status" aria-label="Loading guide">
            <LoaderCircle aria-hidden="true" />
          </div>
        )}
      >
        <doc.Component />
      </Suspense>
    </MDXProvider>
  )

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen} collapseBreakpoint={1100} className="guide-sidebar-provider">
      <GuideSidebar />
      <SidebarInset>
        <GuideSidebarExpandTrigger />
        <div className="docs-layout">
          <main className="guide-main">
            <Breadcrumbs doc={doc} />
        <article className="guide-prose">
          <header className="article-header"><p>{guideCatalog.sectionLabel(doc.section)}</p><h1>{doc.title}</h1>{doc.description && <div>{doc.description}</div>}</header>
          {doc.requiresPlayerData
            ? <PlayerDataProvider>{guideContent}</PlayerDataProvider>
            : guideContent}
        </article>
        <Separator />
        <PrevNext doc={doc} />
          </main>
          <TableOfContents doc={doc} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function HomeSearch() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const needle = query.toLowerCase().trim()
  const { searchIndex, searchLoading } = useGuideSearch(Boolean(needle))
  const results = useMemo(() => {
    if (!needle) return []
    return searchIndex.search(query, 8)
  }, [needle, query, searchIndex])
  const usernameCandidate = query.trim()
  const canLookupPlayer = usernameCandidate.length > 0
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
        placeholder="Search a topic or username"
        aria-label="Search a topic or username"
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
                    <span className="home-player-copy"><strong>{usernameCandidate}</strong><span>View skill recommendations</span></span>
                    <ArrowRight />
                  </CardContent>
                </Card>
              </CommandItem>
            </CommandGroup>
          )}
          {results.length ? (
            <CommandGroup heading="Guide results">
              {results.map(({ document, excerpt, sectionLabel }) => (
                <CommandItem key={document.path} value={document.path} onSelect={() => navigate(document.path)}>
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
                  <span>Try another topic or a RuneScape username.</span>
                </>
              )}
            </CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  )
}

function Home() {
  usePageMetadata({
    path: '/',
    title: 'The RS Guide | Practical RuneScape Guides',
    description: 'Practical RuneScape guides for combat, progression, setup, and account planning.',
    image: '/og/home.png',
    imageAlt: 'The RS Guide homepage preview',
  })
  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.classList.add('home-page')
    return () => document.documentElement.classList.remove('home-page')
  }, [])

  return (
    <HomeBackground>
      <>
        <section className="home-search-landing">
          <div className="home-search-intro">
            <h1>The <span>RS</span> Guide</h1>
          </div>
          <HomeSearch />
          <nav className="home-primary-links" aria-label="Main guide sections">
            <Button size="lg" asChild><Link to="/guides">Guides</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/getting-started">Getting Started</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/setup">Setup Guide</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/extras">Extras</Link></Button>
          </nav>
          <nav className="home-combat-links" aria-label="Combat style guides">
            <Link to="/guides/melee">Melee</Link><span aria-hidden="true">/</span>
            <Link to="/guides/range">Ranged</Link><span aria-hidden="true">/</span>
            <Link to="/guides/magic">Magic</Link><span aria-hidden="true">/</span>
            <Link to="/guides/necromancy">Necromancy</Link>
          </nav>
        </section>
        <SiteSettingsButton
          className="home-settings"
          label="Open homepage settings"
        />
      </>
    </HomeBackground>
  )
}

function NotFound() {
  usePageMetadata({
    path: '/404',
    title: 'Guide Not Found | The RS Guide',
    description: 'The requested RuneScape guide could not be found.',
    image: '/og/home.png',
    imageAlt: 'The RS Guide homepage preview',
  })
  return <main className="not-found"><p className="eyebrow">Lost in Gielinor</p><h1>That guide hasn’t been written.</h1><Button asChild><Link to="/">Return home</Link></Button></main>
}

function App() {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
  const hasGuideSidebar = guideCatalog.documents.some((doc) => doc.path === pathname)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (pathname === '/') document.querySelector<HTMLInputElement>('[data-home-search]')?.focus()
        else setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname])
  return (
    <TooltipProvider>
      <CookieConsent>
        {pathname !== '/' && (
          <Header
            openSearch={() => setSearchOpen(true)}
            showSettings={!hasGuideSidebar}
          />
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/extras/player"
            element={(
              <PlayerDataProvider>
                <Suspense fallback={<div className="guide-loading" role="status" aria-label="Loading player progression"><LoaderCircle /></div>}>
                  <PlayerPage />
                </Suspense>
              </PlayerDataProvider>
            )}
          />
          {guideCatalog.documents.map((doc) => <Route key={doc.path} path={doc.path} element={<DocPage doc={doc} />} />)}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SearchDialog open={searchOpen} setOpen={setSearchOpen} />
      </CookieConsent>
    </TooltipProvider>
  )
}

export default App
