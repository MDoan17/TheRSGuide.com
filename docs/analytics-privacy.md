# Analytics privacy configuration

The site uses two measurement layers:

1. Cloudflare Web Analytics provides anonymous aggregate pageview and visit
   totals for all traffic. It does not use a persistent browser identifier.
2. Self-hosted Rybbit provides daily unique-browser and navigation metrics.
   It is opt-in in the EEA and United Kingdom and opt-out elsewhere.

The Node origin reads Cloudflare's `CF-IPCountry` request header and replaces
the `rs-guide-privacy-region` meta value in each HTML response. Unknown country
codes fail closed to the strict opt-in behavior. No country value is persisted
by this decision.

Rybbit site settings for `thersguide.com`:

- daily user-ID salting on
- bot blocking on
- IP storage off
- URL parameters off
- session replay off
- error, form, copy, button-click, and outbound-click capture off
- initial pageviews and SPA navigation on

Opting out writes Rybbit's supported `disable-rybbit` flag and deletes its
visitor, user, and replay-sampling identifiers from local and session storage.

Detailed ClickHouse `events` rows have a 13-month TTL. Two materialized
aggregate tables retain non-identifying historical totals:

- `daily_site_aggregates`
- `daily_page_aggregates`

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

These are browser estimates, not authenticated players or people. Cloudflare
aggregate visits should be kept alongside them as the all-traffic baseline.
