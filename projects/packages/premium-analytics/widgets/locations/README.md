# Locations widget

Visitor views by country, region, or city — a world map (`@automattic/charts` `GeoChart`) plus a
ranked list. Ported from the Jetpack Stats **Locations** module in Calypso
(`client/my-sites/stats/features/modules/stats-locations`).

## Scope

**v1 ships country-level and city-level views, plus country drill-down into regions.**
A mode switcher (Countries / Cities) and click-to-drill-down on country rows are both included.

What was intentionally **not** ported (Calypso-only infrastructure with no
equivalent here): Redux state + `QuerySiteStats`, `calypso-router`, the
gating/upsell flow (`useShouldGateStats`, `StatsCardUpsell`), the Jetpack
version-upgrade prompt, and analytics event tracking.

## Data / API

All data is fetched through the Premium Analytics data proxy — the connected blog id
is injected server-side, so the client never needs to know it:

- **Country view**: `GET /jetpack-premium-analytics/v1/proxy/v1.1/stats/country-views`
- **Region drill-down**: `GET /jetpack-premium-analytics/v1/proxy/v1.1/stats/location-views/region?filter_by_country={code}`
- **City view**: `GET /jetpack-premium-analytics/v1/proxy/v1.1/stats/location-views/city`

Date range comes from `WidgetRoot`'s `reportParams` (the dashboard's shared date picker),
converted to a trailing-day window by `report-params-adapter.ts`.

When the site is not connected or a request fails, the widget falls back to bundled
**sample data** so it remains demoable without a live connection.

## Known limitations

- **Delta / comparison data**: all rows currently show `delta: 0`; a comparison-period
  fetch is a follow-up.
- **Google GeoChart `provinces` resolution**: not available for all territories (e.g. Taiwan);
  those countries show the world map without regional detail on drill-down.

## Files

- `widget.json` / `widget.ts` — widget metadata + type definition.
- `render.tsx` — the map + ranked list UI (mode switcher, breadcrumb, drill-down).
- `use-location-views.ts` — data hook (country/region/city), normalizer, sample-data fallback.
- `report-params-adapter.ts` — converts `ReportParams` (preset/from/to) to Stats API `num` days.
- `style.module.css` — scoped styles (responsive container query, flex/grid layout).
