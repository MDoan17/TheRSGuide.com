import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { SiteSettingsButton } from '@/components/cookie-consent'
import {
  guideSectionsForPath,
  isLeaguesRoute,
  type GuideNavNode,
  type GuideSection,
} from '@/lib/content'
import {
  activeNavigationKeys,
  setNavigationKeyExpanded,
  syncActiveNavigationKeys,
  type GuideNavigationExpansion,
} from '@/lib/guide-navigation'
import { cn } from '@/lib/utils'

type NavigationExpansionModel = {
  expanded: GuideNavigationExpansion
  setOpen: (key: string, open: boolean) => void
}

const useNavigationExpansion = (pathname: string): NavigationExpansionModel => {
  const sections = guideSectionsForPath(pathname)
  const [expanded, setExpanded] = useState<GuideNavigationExpansion>(() =>
    activeNavigationKeys(sections, pathname),
  )

  useEffect(() => {
    setExpanded((current) => syncActiveNavigationKeys(current, sections, pathname))
  }, [pathname, sections])

  return {
    expanded,
    setOpen: (key, open) => {
      setExpanded((current) => setNavigationKeyExpanded(current, key, open))
    },
  }
}

function MobileNavigationNode({
  node,
  pathname,
  expansion,
  close,
}: {
  node: GuideNavNode
  pathname: string
  expansion: NavigationExpansionModel
  close?: () => void
}) {
  const hasChildren = node.children.length > 0
  const open = expansion.expanded.has(node.doc.path)

  if (!hasChildren) {
    return (
      <NavLink
        to={node.doc.path}
        onClick={close}
        className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
      >
        {node.doc.title}
      </NavLink>
    )
  }

  return (
    <Collapsible
      className="mobile-sidebar-node"
      open={open}
      onOpenChange={(nextOpen) => expansion.setOpen(node.doc.path, nextOpen)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="sidebar-category-toggle"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${node.label}`}
        >
          <span>{node.label}</span>
          {open ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mobile-sidebar-children">
        <NavLink
          to={node.doc.path}
          onClick={close}
          className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
        >
          {node.doc.title}
        </NavLink>
        {node.children.map((child) => (
          <MobileNavigationNode
            key={child.doc.path}
            node={child}
            pathname={pathname}
            expansion={expansion}
            close={close}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

function MobileNavigationSection({
  section,
  pathname,
  expansion,
  close,
}: {
  section: GuideSection
  pathname: string
  expansion: NavigationExpansionModel
  close?: () => void
}) {
  const open = expansion.expanded.has(section.path)

  return (
    <Collapsible
      className="sidebar-section"
      open={open}
      onOpenChange={(nextOpen) => expansion.setOpen(section.path, nextOpen)}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="sidebar-section-toggle"
          aria-label={`${open ? 'Collapse' : 'Expand'} ${section.label}`}
        >
          <span>{section.label}</span>
          {open ? <ChevronDown /> : <ChevronRight />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="sidebar-links">
          {section.index && (
            <NavLink
              to={section.path}
              onClick={close}
              className={({ isActive }) => cn('sidebar-link', isActive && 'active')}
            >
              {section.index.title}
            </NavLink>
          )}
          {section.navigation.map((node) => (
            <MobileNavigationNode
              key={node.doc.path}
              node={node}
              pathname={pathname}
              expansion={expansion}
              close={close}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function MobileGuideNavigation({ close }: { close?: () => void }) {
  const { pathname } = useLocation()
  const sections = guideSectionsForPath(pathname)
  const flattenLeaguesNavigation = isLeaguesRoute(pathname)
  const expansion = useNavigationExpansion(pathname)

  return (
    <nav className="sidebar-nav" aria-label="Guide navigation">
      {sections.map((section) => flattenLeaguesNavigation ? (
        <div key={section.id} className="sidebar-links">
          {section.navigation.map((node) => (
            <MobileNavigationNode
              key={node.doc.path}
              node={node}
              pathname={pathname}
              expansion={expansion}
              close={close}
            />
          ))}
        </div>
      ) : (
        <MobileNavigationSection
          key={section.id}
          section={section}
          pathname={pathname}
          expansion={expansion}
          close={close}
        />
      ))}
    </nav>
  )
}

function DesktopNavigationSubNode({
  node,
  pathname,
  expansion,
}: {
  node: GuideNavNode
  pathname: string
  expansion: NavigationExpansionModel
}) {
  const hasChildren = node.children.length > 0
  const open = expansion.expanded.has(node.doc.path)

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
    <Collapsible
      asChild
      open={open}
      onOpenChange={(nextOpen) => expansion.setOpen(node.doc.path, nextOpen)}
    >
      <SidebarMenuSubItem className="guide-sidebar-node">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="guide-sidebar-category-trigger"
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.label}`}
          >
            <span>{node.label}</span>
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
            {node.children.map((child) => (
              <DesktopNavigationSubNode
                key={child.doc.path}
                node={child}
                pathname={pathname}
                expansion={expansion}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuSubItem>
    </Collapsible>
  )
}

function DesktopNavigationNode({
  node,
  pathname,
  expansion,
}: {
  node: GuideNavNode
  pathname: string
  expansion: NavigationExpansionModel
}) {
  const hasChildren = node.children.length > 0
  const open = expansion.expanded.has(node.doc.path)

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
    <Collapsible
      asChild
      open={open}
      onOpenChange={(nextOpen) => expansion.setOpen(node.doc.path, nextOpen)}
    >
      <SidebarMenuItem className="guide-sidebar-node">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className="guide-sidebar-category-trigger"
            aria-label={`${open ? 'Collapse' : 'Expand'} ${node.label}`}
          >
            <span>{node.label}</span>
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
            {node.children.map((child) => (
              <DesktopNavigationSubNode
                key={child.doc.path}
                node={child}
                pathname={pathname}
                expansion={expansion}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

function DesktopNavigationSection({
  section,
  pathname,
  expansion,
}: {
  section: GuideSection
  pathname: string
  expansion: NavigationExpansionModel
}) {
  const open = expansion.expanded.has(section.path)

  return (
    <Collapsible
      className="guide-sidebar-section"
      open={open}
      onOpenChange={(nextOpen) => expansion.setOpen(section.path, nextOpen)}
    >
      <SidebarGroup>
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger aria-label={`${open ? 'Collapse' : 'Expand'} ${section.label}`}>
            <span>{section.label}</span>
            {open ? <ChevronDown /> : <ChevronRight />}
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.index && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === section.path}>
                    <NavLink to={section.path}>{section.index.title}</NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {section.navigation.map((node) => (
                <DesktopNavigationNode
                  key={node.doc.path}
                  node={node}
                  pathname={pathname}
                  expansion={expansion}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

export function GuideSidebar() {
  const { pathname } = useLocation()
  const sections = guideSectionsForPath(pathname)
  const flattenLeaguesNavigation = isLeaguesRoute(pathname)
  const expansion = useNavigationExpansion(pathname)

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
            {sections.map((section) => flattenLeaguesNavigation ? (
              <SidebarGroup key={section.id}>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.navigation.map((node) => (
                      <DesktopNavigationNode
                        key={node.doc.path}
                        node={node}
                        pathname={pathname}
                        expansion={expansion}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              <DesktopNavigationSection
                key={section.id}
                section={section}
                pathname={pathname}
                expansion={expansion}
              />
            ))}
          </nav>
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="guide-sidebar-footer">
        <SiteSettingsButton
          className="guide-sidebar-settings"
          label="Open site settings"
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function GuideSidebarExpandTrigger() {
  const { isMobile, state } = useSidebar()
  if (isMobile || state !== 'collapsed') return null

  return (
    <SidebarTrigger
      className="guide-sidebar-expand"
      aria-label="Expand guide sidebar"
      title="Expand sidebar"
    />
  )
}
