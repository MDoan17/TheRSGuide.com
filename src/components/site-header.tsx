import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Command as CommandIcon, Menu, Moon, Search, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SiteSettingsButton } from '@/components/cookie-consent'
import { MobileGuideNavigation } from '@/components/guide-navigation'
import { isLeaguesRoute, primaryNavigationForPath } from '@/lib/content'
import { functionalStorageAllowed } from '@/lib/privacy-preferences'
import { cn } from '@/lib/utils'

function Logo() {
  const { pathname } = useLocation()
  const leaguesRoute = isLeaguesRoute(pathname)
  const label = leaguesRoute ? 'The Leagues Guide' : 'The RS Guide'
  const homePath = leaguesRoute ? '/leagues' : '/'

  return (
    <Link to={homePath} className="brand-mark" aria-label={`${label} home`}>
      {label}
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

function SearchButton({
  onClick,
  compact = false,
}: {
  onClick: () => void
  compact?: boolean
}) {
  return (
    <Button
      variant="outline"
      size={compact ? 'icon' : 'default'}
      onClick={onClick}
      className={cn(!compact && 'search-button')}
    >
      <Search data-icon="inline-start" />
      {!compact && (
        <>
          <span>Search guides</span>
          <kbd><CommandIcon /> K</kbd>
        </>
      )}
    </Button>
  )
}

export function SiteHeader({
  openSearch,
  showSettings,
}: {
  openSearch: () => void
  showSettings: boolean
}) {
  const { pathname } = useLocation()
  const primaryNavigation = primaryNavigationForPath(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="top-nav" aria-label="Primary navigation">
          {primaryNavigation.map((link) => (
            <NavLink key={link.id} to={link.path}>{link.label}</NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {pathname !== '/' && <SearchButton onClick={openSearch} />}
          <ThemeToggle />
          {showSettings && <SiteSettingsButton label="Open site settings" />}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mobile-menu">
                <Menu />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
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
