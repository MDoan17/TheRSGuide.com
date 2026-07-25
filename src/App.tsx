import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { MDXProvider } from '@mdx-js/react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Command as CommandIcon, Menu, Moon, Search, Sun, UserRound, Volume2, VolumeX } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { docs, docsBySection, getDoc, searchableText, sectionLabels, sectionOrder, type Doc } from '@/lib/content'
import { mdxComponents } from '@/mdx_components/mdx-components'
import { PlayerDataProvider, usePlayerData } from '@/mdx_components/components/player-data-context'
import { PlayerPage } from '@/pages/player-page'
import { cn } from '@/lib/utils'

function Logo() {
  return (
    <Link to="/" className="brand-mark" aria-label="The RS Guide home">
      The RS Guide
    </Link>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label="Toggle color theme">
      {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}

function SearchButton({ onClick, compact = false }: { onClick: () => void; compact?: boolean }) {
  return (
    <Button variant="outline" size={compact ? 'icon' : 'default'} onClick={onClick} className={cn(!compact && 'search-button')}>
      <Search data-icon="inline-start" />
      {!compact && <><span>Search guides</span><kbd><CommandIcon /> K</kbd></>}
      <span className="sr-only">Search guides</span>
    </Button>
  )
}

type GuideNavNode = {
  doc: Doc
  children: GuideNavNode[]
}

const navGroupLabel = (path: string) => {
  const slug = path.split('/').filter(Boolean).at(-1) ?? path
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function buildGuideNavTree(section: string) {
  const sectionPath = `/${section}`
  const nodes = docsBySection[section]
    .filter((doc) => doc.path !== sectionPath)
    .map((doc) => ({ doc, children: [] as GuideNavNode[] }))
  const nodesByPath = new Map(nodes.map((node) => [node.doc.path, node]))
  const roots: GuideNavNode[] = []

  nodes.forEach((node) => {
    const parentPath = node.doc.path.slice(0, node.doc.path.lastIndexOf('/'))
    const parent = nodesByPath.get(parentPath)
    if (parent) parent.children.push(node)
    else roots.push(node)
  })

  return roots
}

function MobileSidebarNode({ node, pathname, close }: { node: GuideNavNode; pathname: string; close?: () => void }) {
  const hasChildren = node.children.length > 0
  const isCurrentBranch = pathname === node.doc.path || pathname.startsWith(`${node.doc.path}/`)
  const [open, setOpen] = useState(isCurrentBranch)

  useEffect(() => {
    if (isCurrentBranch) setOpen(true)
  }, [isCurrentBranch])

  if (!hasChildren) {
    return <NavLink to={node.doc.path} onClick={close} className={({ isActive }) => cn('sidebar-link', isActive && 'active')}>{node.doc.title}</NavLink>
  }

  return (
    <Collapsible className="mobile-sidebar-node" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="sidebar-category-toggle" aria-label={`${open ? 'Collapse' : 'Expand'} ${navGroupLabel(node.doc.path)}`}>
          <span>{navGroupLabel(node.doc.path)}</span>
          {open ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mobile-sidebar-children">
        <NavLink to={node.doc.path} onClick={close} className={({ isActive }) => cn('sidebar-link', isActive && 'active')}>{node.doc.title}</NavLink>
        {node.children.map((child) => <MobileSidebarNode key={child.doc.path} node={child} pathname={pathname} close={close} />)}
      </CollapsibleContent>
    </Collapsible>
  )
}

function SidebarSection({ section, pathname, close }: { section: string; pathname: string; close?: () => void }) {
  const sectionPath = `/${section}`
  const isCurrentSection = pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
  const [open, setOpen] = useState(isCurrentSection)

  useEffect(() => {
    if (isCurrentSection) setOpen(true)
  }, [isCurrentSection])

  return (
    <Collapsible className="sidebar-section" open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="sidebar-section-toggle" aria-label={`${open ? 'Collapse' : 'Expand'} ${sectionLabels[section]}`}>
          <span>{sectionLabels[section]}</span>
          {open ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="sidebar-links">
          {getDoc(sectionPath) && <NavLink to={sectionPath} onClick={close} className={({ isActive }) => cn('sidebar-link', isActive && 'active')}>{getDoc(sectionPath)?.title}</NavLink>}
          {buildGuideNavTree(section).map((node) => <MobileSidebarNode key={node.doc.path} node={node} pathname={pathname} close={close} />)}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function SidebarNav({ close }: { close?: () => void }) {
  const { pathname } = useLocation()
  return (
    <nav className="sidebar-nav" aria-label="Guide navigation">
      {sectionOrder.map((section) => <SidebarSection key={section} section={section} pathname={pathname} close={close} />)}
    </nav>
  )
}

function GuideSidebarSubNode({ node, pathname }: { node: GuideNavNode; pathname: string }) {
  const hasChildren = node.children.length > 0
  const isCurrentBranch = pathname === node.doc.path || pathname.startsWith(`${node.doc.path}/`)
  const [open, setOpen] = useState(isCurrentBranch)

  useEffect(() => {
    if (isCurrentBranch) setOpen(true)
  }, [isCurrentBranch])

  if (!hasChildren) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton asChild isActive={pathname === node.doc.path}>
          <NavLink to={node.doc.path}>{node.doc.title}</NavLink>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <SidebarMenuSubItem className="guide-sidebar-node">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="guide-sidebar-category-trigger" aria-label={`${open ? 'Collapse' : 'Expand'} ${navGroupLabel(node.doc.path)}`}>
            <span>{navGroupLabel(node.doc.path)}</span>
            {open ? <ChevronDown /> : <ChevronRight />}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={pathname === node.doc.path}>
                <NavLink to={node.doc.path}>{node.doc.title}</NavLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {node.children.map((child) => <GuideSidebarSubNode key={child.doc.path} node={child} pathname={pathname} />)}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

function GuideSidebarNode({ node, pathname }: { node: GuideNavNode; pathname: string }) {
  const hasChildren = node.children.length > 0
  const isCurrentBranch = pathname === node.doc.path || pathname.startsWith(`${node.doc.path}/`)
  const [open, setOpen] = useState(isCurrentBranch)

  useEffect(() => {
    if (isCurrentBranch) setOpen(true)
  }, [isCurrentBranch])

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === node.doc.path}>
          <NavLink to={node.doc.path}>{node.doc.title}</NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <SidebarMenuItem className="guide-sidebar-node">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="guide-sidebar-category-trigger" aria-label={`${open ? 'Collapse' : 'Expand'} ${navGroupLabel(node.doc.path)}`}>
            <span>{navGroupLabel(node.doc.path)}</span>
            {open ? <ChevronDown /> : <ChevronRight />}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <SidebarMenuSubButton asChild isActive={pathname === node.doc.path}>
                <NavLink to={node.doc.path}>{node.doc.title}</NavLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
            {node.children.map((child) => <GuideSidebarSubNode key={child.doc.path} node={child} pathname={pathname} />)}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function GuideSidebarSection({ section, pathname }: { section: string; pathname: string }) {
  const sectionPath = `/${section}`
  const isCurrentSection = pathname === sectionPath || pathname.startsWith(`${sectionPath}/`)
  const [open, setOpen] = useState(isCurrentSection)

  useEffect(() => {
    if (isCurrentSection) setOpen(true)
  }, [isCurrentSection])

  return (
    <Collapsible className="guide-sidebar-section" open={open} onOpenChange={setOpen}>
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger aria-label={`${open ? 'Collapse' : 'Expand'} ${sectionLabels[section]}`}>
            <span>{sectionLabels[section]}</span>
            {open ? <ChevronDown /> : <ChevronRight />}
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {getDoc(sectionPath) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === sectionPath}>
                    <NavLink to={sectionPath}>{getDoc(sectionPath)?.title}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {buildGuideNavTree(section).map((node) => <GuideSidebarNode key={node.doc.path} node={node} pathname={pathname} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function GuideSidebar() {
  const { pathname } = useLocation()
  return (
    <Sidebar collapsible="offcanvas" className="guide-sidebar">
      <SidebarHeader>
        <div className="guide-sidebar-header">
          <SidebarTrigger aria-label="Collapse guide sidebar" title="Collapse sidebar" />
        </div>
      </SidebarHeader>
      <SidebarContent className="guide-sidebar-content">
        <ScrollArea type="always" className="guide-sidebar-scroll">
          <nav className="guide-sidebar-nav" aria-label="Guide navigation">
            {sectionOrder.map((section) => <GuideSidebarSection key={section} section={section} pathname={pathname} />)}
          </nav>
        </ScrollArea>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function GuideSidebarExpandTrigger() {
  const { isMobile, state } = useSidebar()
  if (isMobile || state !== 'collapsed') return null

  return <SidebarTrigger className="guide-sidebar-expand" aria-label="Expand guide sidebar" title="Expand sidebar" />
}

function SearchDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const needle = query.toLowerCase().trim()
    if (!needle) return docs.slice(0, 14)
    return docs.filter((doc) => `${doc.title} ${doc.description} ${searchableText(doc)}`.toLowerCase().includes(needle)).slice(0, 30)
  }, [query])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="search-dialog">
        <DialogHeader><DialogTitle className="sr-only">Search The RS Guide</DialogTitle></DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput value={query} onValueChange={setQuery} placeholder="Search every guide…" />
          <ScrollArea type="always" className="search-dialog-results">
            <CommandList className="search-dialog-list">
              <CommandEmpty>No guide matched that search.</CommandEmpty>
              <CommandGroup heading={query ? 'Results' : 'Browse guides'}>
                {results.map((doc) => (
                  <CommandItem key={doc.path} value={doc.path} onSelect={() => { navigate(doc.path); setOpen(false) }}>
                    <BookOpen />
                    <div><strong>{doc.title}</strong><span>{sectionLabels[doc.section]}{doc.description ? ` · ${doc.description}` : ''}</span></div>
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

function Header({ openSearch }: { openSearch: () => void }) {
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="top-nav" aria-label="Primary navigation">
          {sectionOrder.map((section) => <NavLink key={section} to={`/${section}`}>{sectionLabels[section]}</NavLink>)}
        </nav>
        <div className="header-actions">
          {pathname !== '/' && <SearchButton onClick={openSearch} />}
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="mobile-menu"><Menu /><span className="sr-only">Open menu</span></Button></SheetTrigger>
            <SheetContent side="left" className="mobile-sheet">
              <SheetHeader><SheetTitle><Logo /></SheetTitle></SheetHeader>
              <ScrollArea className="mobile-sidebar-scroll">
                <SidebarNav close={() => setMobileOpen(false)} />
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function Breadcrumbs({ doc }: { doc: Doc }) {
  const parts = doc.path.split('/').filter(Boolean)
  return (
    <div className="breadcrumbs">
      <Link to="/">Home</Link>
      {parts.map((part, index) => {
        const path = `/${parts.slice(0, index + 1).join('/')}`
        const label = getDoc(path)?.title ?? sectionLabels[part] ?? part.replace(/-/g, ' ')
        return <span key={path}><ChevronRight />{index === parts.length - 1 ? <b>{label}</b> : <Link to={path}>{label}</Link>}</span>
      })}
    </div>
  )
}

function TableOfContents() {
  const { pathname } = useLocation()
  const [items, setItems] = useState<{ id: string; text: string; level: number }[]>([])
  useEffect(() => {
    const article = document.querySelector('.guide-prose')
    const update = () => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>('.guide-prose h2, .guide-prose h3'))
      setItems(headings.map((heading, index) => {
        if (!heading.id) heading.id = `${heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section'}-${index}`
        return { id: heading.id, text: heading.textContent || '', level: Number(heading.tagName.slice(1)) }
      }))
    }
    update()
    const observer = new MutationObserver(update)
    if (article) observer.observe(article, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [pathname])
  if (!items.length) return null
  return (
    <aside className="toc">
      <ScrollArea className="toc-scroll">
        <nav className="toc-content" aria-labelledby="toc-title">
          <p id="toc-title">On this page</p>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <a className={item.level === 3 ? 'toc-nested' : ''} href={`#${item.id}`}>{item.text}</a>
              </li>
            ))}
          </ul>
        </nav>
      </ScrollArea>
    </aside>
  )
}

function PrevNext({ doc }: { doc: Doc }) {
  const list = docsBySection[doc.section]
  const index = list.findIndex((item) => item.path === doc.path)
  const previous = list[index - 1]
  const next = list[index + 1]
  return (
    <div className="prev-next">
      {previous ? <Link to={previous.path}><ChevronLeft /><span><small>Previous</small>{previous.title}</span></Link> : <span />}
      {next && <Link to={next.path}><span><small>Next</small>{next.title}</span><ChevronRight /></Link>}
    </div>
  )
}

function DocPage({ doc }: { doc: Doc }) {
  useEffect(() => { document.title = `${doc.title} | The RS Guide`; window.scrollTo(0, 0) }, [doc])
  const sidebarDefaultOpen = !document.cookie.includes('sidebar_state=false')

  return (
    <SidebarProvider defaultOpen={sidebarDefaultOpen} className="guide-sidebar-provider">
      <GuideSidebar />
      <SidebarInset>
        <GuideSidebarExpandTrigger />
        <div className="docs-layout">
          <main className="guide-main">
            <Breadcrumbs doc={doc} />
        <article className="guide-prose">
          <header className="article-header"><p>{sectionLabels[doc.section]}</p><h1>{doc.title}</h1>{doc.description && <div>{doc.description}</div>}</header>
          <MDXProvider components={mdxComponents}><Suspense fallback={<div className="guide-loading">Opening guide…</div>}><doc.Component /></Suspense></MDXProvider>
        </article>
        <Separator />
        <PrevNext doc={doc} />
          </main>
          <TableOfContents />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function searchExcerpt(doc: Doc, query: string) {
  if (doc.description.toLowerCase().includes(query)) return doc.description
  const content = searchableText(doc).replace(/\s+/g, ' ').trim()
  const match = content.toLowerCase().indexOf(query)
  if (match < 0) return doc.description || `Browse the ${sectionLabels[doc.section]} section.`
  const start = Math.max(0, match - 48)
  const end = Math.min(content.length, match + query.length + 86)
  return `${start > 0 ? '…' : ''}${content.slice(start, end).trim()}${end < content.length ? '…' : ''}`
}

function HomeSearch() {
  const navigate = useNavigate()
  const { playerData, loading: playerLoading, error: playerError, searchPlayer } = usePlayerData()
  const [query, setQuery] = useState('')
  const [resultsOpen, setResultsOpen] = useState(false)
  const needle = query.toLowerCase().trim()
  const results = useMemo(() => {
    if (!needle) return []
    return docs
      .map((doc, index) => {
        const title = doc.title.toLowerCase()
        const description = doc.description.toLowerCase()
        const content = searchableText(doc).toLowerCase()
        const rank = title === needle ? 0 : title.startsWith(needle) ? 1 : title.includes(needle) ? 2 : description.includes(needle) ? 3 : content.includes(needle) ? 4 : -1
        return { doc, index, rank }
      })
      .filter((result) => result.rank >= 0)
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .slice(0, 8)
      .map((result) => result.doc)
  }, [needle])
  const usernameCandidate = query.trim()
  const canLookupPlayer = usernameCandidate.length > 0
    && usernameCandidate.length <= 12
    && /^[a-z0-9 _-]+$/i.test(usernameCandidate)
  const matchingPlayer = canLookupPlayer
    && playerData?.username.toLowerCase() === usernameCandidate.toLowerCase()
      ? playerData
      : null

  useEffect(() => {
    if (!canLookupPlayer || matchingPlayer) return
    const timer = window.setTimeout(() => {
      void searchPlayer(usernameCandidate)
    }, 650)
    return () => window.clearTimeout(timer)
  }, [canLookupPlayer, matchingPlayer, searchPlayer, usernameCandidate])

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
        placeholder="Search topics or enter your username"
        aria-label="Search topics or enter your RuneScape username"
      />
      {needle && resultsOpen && (
        <CommandList className="home-search-results">
          {canLookupPlayer && playerLoading && !matchingPlayer && (
            <CommandGroup heading="Player lookup">
              <CommandItem disabled className="home-player-loading"><UserRound /><span>Looking up {usernameCandidate}…</span></CommandItem>
            </CommandGroup>
          )}
          {matchingPlayer && (
            <CommandGroup heading="Player">
              <CommandItem
                value={`player-${matchingPlayer.username}`}
                className="home-player-result"
                onSelect={() => navigate(`/extras/player?username=${encodeURIComponent(matchingPlayer.username)}`)}
              >
                <Card size="sm">
                  <CardContent>
                    <span className="home-player-icon"><UserRound /></span>
                    <span className="home-player-copy"><strong>{matchingPlayer.username}</strong><span>Total level {matchingPlayer.totalLevel.toLocaleString()}</span></span>
                    <ArrowRight />
                  </CardContent>
                </Card>
              </CommandItem>
            </CommandGroup>
          )}
          {results.length ? (
            <CommandGroup heading="Guide results">
              {results.map((doc) => (
                <CommandItem key={doc.path} value={doc.path} onSelect={() => navigate(doc.path)}>
                  <BookOpen />
                  <div className="home-search-result-copy">
                    <strong>{doc.title}</strong>
                    <span>{searchExcerpt(doc, needle)}</span>
                  </div>
                  <small>{sectionLabels[doc.section]}</small>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : (
            <CommandEmpty>
              <strong>No guide found for “{query.trim()}”</strong>
              <span>{canLookupPlayer && playerError ? `${playerError}. RuneMetrics profiles must be public.` : 'Try another topic or a RuneScape username.'}</span>
            </CommandEmpty>
          )}
        </CommandList>
      )}
    </Command>
  )
}

const HOME_BACKGROUND_VIDEO_URL = 'https://player.vimeo.com/video/1212838611?background=1&autoplay=1&muted=1&loop=1&autopause=0&dnt=1'

function Home() {
  const videoRef = useRef<HTMLIFrameElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoMuted, setVideoMuted] = useState(true)
  const [videoVolume, setVideoVolume] = useState(10)
  const [videoEnabled, setVideoEnabled] = useState(() => {
    const savedPreference = window.localStorage.getItem('home-background-video')
    if (savedPreference !== null) return savedPreference === 'true'
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    document.title = 'The RS Guide | Practical RuneScape Guides'
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('home-background-video', String(videoEnabled))
  }, [videoEnabled])

  useEffect(() => {
    if (!videoEnabled) {
      setVideoLoaded(false)
      setVideoMuted(true)
    }
  }, [videoEnabled])

  useEffect(() => {
    if (!videoEnabled) return

    const handleVimeoMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://player.vimeo.com'
        || event.source !== videoRef.current?.contentWindow
      ) return

      let payload: unknown = event.data
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }

      if (
        typeof payload === 'object'
        && payload !== null
        && (payload as { event?: string }).event === 'playing'
      ) setVideoLoaded(true)
    }

    window.addEventListener('message', handleVimeoMessage)
    return () => window.removeEventListener('message', handleVimeoMessage)
  }, [videoEnabled])

  const sendBackgroundVideoVolume = (volume: number) => {
    videoRef.current?.contentWindow?.postMessage(
      { method: 'setVolume', value: volume / 100 },
      'https://player.vimeo.com',
    )
  }

  const setBackgroundVideoMuted = (muted: boolean) => {
    sendBackgroundVideoVolume(muted ? 0 : videoVolume)
    setVideoMuted(muted)
  }

  const setBackgroundVideoVolume = ([volume]: number[]) => {
    setVideoVolume(volume)
    setVideoMuted(volume === 0)
    sendBackgroundVideoVolume(volume)
  }

  return (
    <main className="home home-search-page" data-video-enabled={videoEnabled}>
      {videoEnabled && (
        <>
          <div
            className="home-video-background"
            data-video-playing={videoLoaded}
            aria-hidden="true"
          >
            <iframe
              ref={videoRef}
              id="home-background-video"
              src={HOME_BACKGROUND_VIDEO_URL}
              title="Homepage background video"
              tabIndex={-1}
              allow="autoplay; fullscreen; picture-in-picture"
              loading="eager"
              onLoad={() => {
                setVideoLoaded(false)
                setBackgroundVideoMuted(true)
                videoRef.current?.contentWindow?.postMessage(
                  { method: 'addEventListener', value: 'playing' },
                  'https://player.vimeo.com',
                )
              }}
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="home-video-scrim" aria-hidden="true" />
        </>
      )}
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
      <div className="home-media-controls">
        {videoEnabled && (
          <div className="home-audio-controls" data-muted={videoMuted}>
            {!videoMuted && (
              <Slider
                className="home-volume-slider"
                value={[videoVolume]}
                min={1}
                max={100}
                step={1}
                onValueChange={setBackgroundVideoVolume}
                aria-label="Background video volume"
                aria-valuetext={`${videoVolume}%`}
              />
            )}
            <Button
              className="home-audio-control"
              variant="ghost"
              size="icon"
              onClick={() => setBackgroundVideoMuted(!videoMuted)}
              aria-label={videoMuted ? 'Unmute background video' : 'Mute background video'}
              title={videoMuted ? 'Unmute background video' : 'Mute background video'}
            >
              {videoMuted ? <VolumeX /> : <Volume2 />}
            </Button>
          </div>
        )}
        <label className="home-video-control" htmlFor="home-background-video-toggle">
          <span>Background video</span>
          <Switch
            id="home-background-video-toggle"
            checked={videoEnabled}
            onCheckedChange={setVideoEnabled}
          />
        </label>
      </div>
    </main>
  )
}

function NotFound() {
  return <main className="not-found"><p className="eyebrow">Lost in Gielinor</p><h1>That guide hasn’t been written.</h1><Button asChild><Link to="/">Return home</Link></Button></main>
}

function App() {
  const { pathname } = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)
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
      <PlayerDataProvider>
        {pathname !== '/' && <Header openSearch={() => setSearchOpen(true)} />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/extras/player" element={<PlayerPage />} />
          {docs.map((doc) => <Route key={doc.path} path={doc.path} element={<DocPage doc={doc} />} />)}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SearchDialog open={searchOpen} setOpen={setSearchOpen} />
      </PlayerDataProvider>
    </TooltipProvider>
  )
}

export default App
