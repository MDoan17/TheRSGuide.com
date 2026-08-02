import { Link } from "react-router"

import { Button } from "@/components/ui/button"

function PrivacyNotice() {
  return (
    <main className="mx-auto min-h-[calc(100svh-4rem)] w-full max-w-[52rem] px-5 py-12 sm:px-8 sm:py-16">
      <article className="text-[.92rem] leading-7 text-muted-foreground [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:text-foreground [&_li]:mb-2 [&_strong]:text-foreground [&_ul]:pl-5">
        <p className="mb-2 text-xs font-bold tracking-[.12em] text-primary uppercase">
          Updated August 2, 2026
        </p>
        <h1 className="mt-0 mb-4 text-4xl text-foreground">Privacy notice</h1>
        <p>
          The RS Guide collects the minimum information needed to measure which
          guides are useful and to remember features you choose. We do not sell
          visitor data, use it for advertising, or send player names and form
          values to analytics.
        </p>

        <h2>Anonymous aggregate measurement</h2>
        <p>
          Cloudflare Web Analytics measures aggregate pageviews and visits. It
          does not use cookies, localStorage, fingerprinting, or a persistent
          visitor identifier. These totals cannot be used to identify you.
        </p>

        <h2>Optional browser analytics</h2>
        <p>
          Our self-hosted Rybbit service records page paths, page titles,
          referrers, browser and device type, language, screen size, and coarse
          location. It assigns a random browser identifier so daily unique
          browsers and navigation can be measured. IP addresses and player
          names are not stored, URL parameters and session recording are off,
          and identifiers are salted daily on the server.
        </p>
        <p>
          In the EEA and United Kingdom this analytics remains off until you
          allow it. Elsewhere it is enabled based on our legitimate interest in
          understanding site usage, but you can disable it anytime in Privacy
          Settings. Disabling it stops future events and deletes Rybbit's local
          browser identifiers.
        </p>

        <h2>Saved progress and preferences</h2>
        <p>
          If enabled, localStorage remembers player searches, manually checked
          progression, guide checklists, theme, sidebar state, and background
          media choices. This information stays in your browser and can be
          removed by disabling optional storage.
        </p>

        <h2>Retention and sharing</h2>
        <p>
          Detailed analytics events are retained for no longer than 13 months.
          Anonymous daily totals may be retained longer for historical traffic
          reporting. Analytics is self-hosted in the United States and is not
          sold or shared for targeted advertising.
        </p>

        <h2>Third-party media</h2>
        <p>
          Vimeo background media is not loaded before optional storage is
          allowed in strict-consent regions. YouTube videos use its privacy-
          enhanced domain and otherwise load only after you request the video.
        </p>

        <h2>Your choices</h2>
        <p>
          Open the gear button on any page and choose Privacy Settings to change
          or withdraw your choices. To ask a privacy question or request access
          or deletion, use <strong>Settings → Send us a message</strong>.
        </p>

        <Button className="mt-8" variant="outline" asChild>
          <Link to="/">Return home</Link>
        </Button>
      </article>
    </main>
  )
}

export { PrivacyNotice }
