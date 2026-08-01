import { HomeLanding, type LandingLink } from "@/components/home/home-landing"
import { LeaguesCountdown } from "@/components/home/leagues-countdown"

const leaguesPrimaryLinks: readonly LandingLink[] = [
  {
    label: "Leagues II",
    to: "/leagues/leagues-ii",
    highlighted: true,
  },
  { label: "RS for OS", to: "/leagues/rs-for-os-players" },
  { label: "Regions", to: "/leagues/map" },
]

function LeaguesHome() {
  return (
    <HomeLanding
      variant="leagues"
      title={
        <>
          The <span>Leagues</span> Guide
        </>
      }
      primaryLinks={leaguesPrimaryLinks}
      spotlight={<LeaguesCountdown />}
      backLink={{ label: "Back to Main Site", to: "/" }}
    />
  )
}

export { LeaguesHome }
