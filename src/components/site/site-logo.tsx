import { Link, useLocation } from "react-router"

import { isLeaguesRoute } from "@/lib/content"

function SiteLogo() {
  const { pathname } = useLocation()
  const leaguesRoute = isLeaguesRoute(pathname)
  const label = leaguesRoute ? "The Leagues Guide" : "The RS Guide"
  const homePath = leaguesRoute ? "/leagues" : "/"

  return (
    <Link
      to={homePath}
      className="inline-flex items-center whitespace-nowrap font-brand font-bold tracking-[.02em]"
      aria-label={`${label} home`}
    >
      {label}
    </Link>
  )
}

export { SiteLogo }
