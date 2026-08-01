import { HomeLanding, type LandingLink } from "@/components/home/home-landing"
import { homepagePrimaryLinks } from "@/lib/homepage-mode"

const evergreenCombatLinks: readonly LandingLink[] = [
  { label: "Melee", to: "/guides/melee" },
  { label: "Ranged", to: "/guides/range" },
  { label: "Magic", to: "/guides/magic" },
  { label: "Necromancy", to: "/guides/necromancy" },
]

function EvergreenHome() {
  return (
    <HomeLanding
      variant="evergreen"
      title={
        <>
          The <span>RS</span> Guide
        </>
      }
      primaryLinks={homepagePrimaryLinks(import.meta.env.VITE_HOMEPAGE_MODE)}
      secondaryLabel="Combat style guides"
      secondaryLinks={evergreenCombatLinks}
    />
  )
}

export { EvergreenHome }
