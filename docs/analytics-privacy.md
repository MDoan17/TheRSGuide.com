# Analytics privacy configuration

The site sends a minimal pageview to its self-hosted Rybbit service. This is on
by default and can be turned off from Privacy Settings. The opt-out is stored in
the site's preference cookie without a unique browser ID.

The Node origin still reads Cloudflare's `CF-IPCountry` request header to choose
whether progress and preferences are remembered by default. It does not use
the country value to decide whether Rybbit runs, and it does not persist the
country value.

Rybbit site settings for `thersguide.com`:

- daily user-ID salting on
- bot blocking on
- IP storage off
- URL parameters off
- session replay off
- error, form, copy, button-click, and outbound-click capture off
- page paths, query strings, referrers, screen details, and browser IDs omitted
- one minimal event per initial pageview and SPA navigation

The site bypasses Rybbit's browser script and posts the minimal event directly.
It also removes identifiers left by older versions of the script from local and
session storage.

Detailed ClickHouse `events` rows have a 13-month TTL. Two materialized
aggregate tables retain non-identifying historical totals:

- `daily_site_aggregates`
- `daily_page_aggregates`

The intended middle-ground policy is to reduce the raw `events` TTL to 48
hours after confirming both aggregate tables are receiving complete daily
data. This is a ClickHouse/Rybbit server change; the frontend cannot enforce
it. Do not describe the shorter retention period in the public notice until
the production TTL has been changed and verified.

Daily traffic query:

```sql
SELECT
  date,
  sum(pageviews) AS pageviews,
  uniqMerge(sessions) AS sessions,
  uniqMerge(visitors) AS daily_unique_browsers
FROM daily_site_aggregates
WHERE site_id = 1
GROUP BY date
ORDER BY date;
```

These are estimates, not authenticated players or exact counts of people.

The homepage Vimeo background is separate from analytics and saved-progress
preferences. It loads automatically with Vimeo's `dnt=1` option. YouTube
embeds remain click-to-load in strict regions.
