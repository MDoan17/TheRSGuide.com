import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { MDXProvider } from '@mdx-js/react'
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react'
import { GuideSidebar, GuideSidebarExpandTrigger } from '@/components/guide-navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { PlayerDataProvider } from '@/features/player/player-data-context'
import { guideCatalog, type Doc } from '@/lib/content'
import { openGraphImagePath, usePageMetadata } from '@/lib/page-metadata'
import { functionalStorageAllowed } from '@/lib/privacy-preferences'
import { cn } from '@/lib/utils'
import { mdxComponents } from '@/mdx_components/mdx-components'

function Breadcrumbs({ doc }: { doc: Doc }) {
  const breadcrumbs = guideCatalog.breadcrumbs(doc.path)

  return (
    <div className="breadcrumbs">
      <Link to="/">Home</Link>
      {breadcrumbs.map((breadcrumb) => (
        <span key={breadcrumb.path}>
          <ChevronRight />
          {breadcrumb.current
            ? <b>{breadcrumb.label}</b>
            : <Link to={breadcrumb.path}>{breadcrumb.label}</Link>}
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
        if (!heading.id) {
          heading.id = `${heading.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'section'}-${index}`
        }
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

  if (!doc.hasTableOfContents) return null

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
      {previous ? (
        <Link to={previous.path}>
          <ChevronLeft />
          <span><small>Previous</small>{previous.title}</span>
        </Link>
      ) : <span />}
      {next && (
        <Link to={next.path}>
          <span><small>Next</small>{next.title}</span>
          <ChevronRight />
        </Link>
      )}
    </div>
  )
}

export function GuidePage({ doc }: { doc: Doc }) {
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
    <SidebarProvider defaultOpen={sidebarDefaultOpen} className="guide-sidebar-provider">
      <GuideSidebar />
      <SidebarInset>
        <GuideSidebarExpandTrigger />
        <div className="docs-layout">
          <main className="guide-main">
            <Breadcrumbs doc={doc} />
            <article className="guide-prose">
              {doc.showPageHeader && (
                <header className="article-header">
                  <p>{guideCatalog.sectionLabel(doc.section)}</p>
                  <h1>{doc.title}</h1>
                  {doc.description && <div>{doc.description}</div>}
                </header>
              )}
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
