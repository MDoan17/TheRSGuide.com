import { LeaguesHome } from "@/components/home/leagues-home"
import { usePageMetadata } from "@/lib/page-metadata"

function LeaguesHomePage() {
  usePageMetadata({
    path: "/leagues",
    title: "RuneScape Leagues Guide | The RS Guide",
    description:
      "RuneScape Leagues guides for relics, blessings, regions, routes, skilling, and players coming from Old School RuneScape.",
    image: "/og/leagues.png",
    imageAlt: "The RuneScape Leagues Guide homepage preview",
  })

  return <LeaguesHome />
}

export { LeaguesHomePage }
