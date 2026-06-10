# Locations widget

Visitor views by country — a world map (`@automattic/charts` `GeoChart`) plus a
ranked list. Ported from the Jetpack Stats **Locations** module in Calypso
(`client/my-sites/stats/features/modules/stats-locations`).

## Scope

**v1 is country-level only.** The source module also offers Region and City
views (a segmented control) and a country filter dropdown. Those are a
follow-up because they depend on the modern `location-views/{geoMode}` endpoint
(see below), whereas the country view works off the existing legacy endpoint.

What was intentionally **not** ported (Calypso-only infrastructure with no
equivalent here): Redux state + `QuerySiteStats`, `calypso-router`, the
gating/upsell flow (`useShouldGateStats`, `StatsCardUpsell`), the Jetpack
version-upgrade prompt, and analytics event tracking.

## Data / API dependencies (needs package support)

This is the part that needs the package's data layer, tracked separately from
the UI port:

1. **Site id on the page.** The widget reads `window.configData.blog_id` (the
   Odyssey convention). `src/stats-config.php` exposes it on the Premium
   Analytics page from `Jetpack_Options::get_option( 'id' )` — bridge wiring
   expected to be subsumed by the PA data package. When the id is absent (site
   not connected), the widget falls back to bundled **sample data**.
2. **stats-admin proxy must be loaded.** Data is fetched through
   `/jetpack/v4/stats-app/sites/{blogId}/stats/country-views`, registered by the
   `jetpack-stats-admin` package's REST controller (it forwards to the wpcom
   `country-views` endpoint, with the blog id baked into the route server-side).
   The widget assumes that route is registered on the site.
3. **Regions/Cities can use the dedicated `location-views` proxy route.**
   stats-admin registers
   `/stats/location-views/(?P<geo_mode>country|region|city)` alongside the
   generic single-segment resource route, so the modern endpoint the Calypso
   hook uses *is* reachable. v1 uses the legacy `country-views` (sufficient for
   country-level data); switching to `location-views/{geoMode}` is the natural
   path when adding the Region/City views and the country filter.

When the blog id becomes available the live fetch path activates with no widget
changes; until then the sample-data fallback keeps the widget demoable.

## Files

- `widget.json` / `widget.ts` — widget metadata + type definition.
- `render.tsx` — the map + ranked list UI.
- `use-location-views.ts` — data hook, the `statsCountryViews` normalizer
  (country/summary branch), and the sample-data fallback.
- `style.module.css` — scoped styles.
