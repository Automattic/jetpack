# Podcast

The wp-admin Podcast experience for the Jetpack plugin: the SPA, REST
settings, and RSS feed customization for podcasting on Simple and Atomic
sites. The package owns the experience outright now that the legacy stack
it replaced has been removed.

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
   lists, grids).
4. **`@wordpress/admin-ui`** — page layout primitives, accessed via
   `AdminPage` from `@automattic/jetpack-components` (which wraps
   admin-ui's `Page`).

Rationale: WordPress is moving new work to `@wordpress/ui`;
`@wordpress/components` is being kept as a legacy fallback.
