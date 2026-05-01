# Activity Log

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
   lists, grids). Already the backbone here. Extend via its
   sub-components (`DataViews.Search`, `DataViews.FiltersToggle`,
   `DataViews.Layout`, `DataViews.Footer`) before reaching for lower-
   level primitives.
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
