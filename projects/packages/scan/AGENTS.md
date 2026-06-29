# Scan

The Scan UI for the Jetpack plugin's wp-admin. Ports the Calypso
Dashboard's Scan overview onto a native wp-admin page so customers see
the same active-threats and scan-history experience without leaving
their site.

## Calypso source pin

This package is a port of:

- `client/dashboard/sites/scan/`
- `client/dashboard/sites/scan-active/`
- `client/dashboard/sites/scan-history/`

Pinned at Calypso commit: `<<calypso-sha-to-record-on-first-port>>`.

When re-syncing from upstream, update the pin above and note any
behaviour deltas in the relevant changelog entry.

## UI primitives

When adding React UI in this package, prefer the WordPress Design System
packages in this order:

1. **`@wordpress/ui`** — foundational primitives. Check each component's
   Storybook "Status" badge (anything other than "stable" is still in
   flux); avoid experimental APIs here.
2. **`@wordpress/components`** — general-purpose legacy library.
   Predates the design system. Use only when `@wordpress/ui` doesn't
   have a stable equivalent, and still check Status in Storybook.
3. **`@wordpress/dataviews`** — higher-level data presentation (tables,
   lists, grids). The backbone of Active Threats and History tabs.
   Extend via its sub-components (`DataViews.Search`,
   `DataViews.FiltersToggle`, `DataViews.Layout`, `DataViews.Footer`)
   before reaching for lower-level primitives.
4. **`@wordpress/admin-ui`** — page layout primitives, accessed via
   `AdminPage` from `@automattic/jetpack-components` (which wraps
   admin-ui's `Page`).

Rationale: WordPress is moving new work to `@wordpress/ui`;
`@wordpress/components` is being kept as a legacy fallback. Guidance
from the WordPress Design System P2 (April 2026).

## Design-system lookup

A dedicated MCP server is wired into this project's local Claude Code
config: `@wordpress/design-system-mcp`. It exposes the authoritative
list of stable `@wordpress/ui` + `@wordpress/components` components and
`--wpds-*` design tokens. Prefer querying it over spelunking through
`node_modules/@wordpress/components/src/**` for component metadata.

## Reused threat primitives

`ThreatSeverityBadge`, the `Threat` type, and the lower-level
`ThreatsDataViews` view live in `@automattic/jetpack-scan` (the existing
js-package). Reuse those building blocks rather than re-inventing them
here. The Calypso source ships richer modals (fix / ignore / unignore /
view-details / bulk-fix) than the js-package — those are ported into
this package.

## Mock mode

Append `?jps-mock=1` to the wp-admin URL to short-circuit every gate and
render the overview against fixture threats from
`src/js/data/mock/fixtures.ts`. No server requests are made in this
mode. Useful for design iteration on Jurassic Tube / Docker without a
Scan plan or WPCOM connection.
