import { GuideSearchProvider } from '@/components/search/guide-search-provider'
import { SiteSettingsProvider } from '@/components/settings/site-settings-provider'
import { SiteShell } from '@/components/site/site-shell'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import { AppRoutes } from '@/routes'

function App() {
  return (
    <TooltipProvider>
      <SiteSettingsProvider>
        <GuideSearchProvider>
          <SiteShell>
            <AppRoutes />
          </SiteShell>
          <Toaster position="bottom-right" richColors />
        </GuideSearchProvider>
      </SiteSettingsProvider>
    </TooltipProvider>
  )
}

export default App
