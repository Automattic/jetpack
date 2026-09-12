# Jetpack Search

## UI Components

**Always use existing design system components instead of writing custom ones.**

The Jetpack Search dashboard is actively migrating to standard WordPress components. When building UI, follow this priority order:

### Priority 1: `@wordpress/ui`
The primary component library for new Jetpack work. Use for:
- `Button`, `Link`
- `Notice.Root` / `Notice.Title` / `Notice.Description`
- Tabs, dialogs, and layout primitives

### Priority 2: `@wordpress/components`
Fallback for anything not yet in `@wordpress/ui`:
- `ToggleControl`, `TextareaControl`, `SelectControl`
- `Tabs`, `TabPanel`
- `Notice` (legacy)

### Priority 3: `@automattic/jetpack-components`
Jetpack-specific components (upsell cards, plan badges, etc.).

### Never reinvent
Do **not** create custom implementations of:
- Tab bars → use `@wordpress/components` `Tabs` or `@wordpress/ui`
- Buttons → use `@wordpress/ui` `Button`
- Notices/alerts → use `@wordpress/ui` `Notice`
- Toggles/checkboxes → use `@wordpress/components` `ToggleControl`

When unsure which component to use, the `@wordpress/design-system-mcp` MCP is configured for this project — use it to look up the right component before building a custom one.

## Data access

- `@automattic/jetpack-shared-extension-utils` → `getSiteFragment()` for site domain
- `@automattic/jetpack-script-data` → `isWpcomPlatformSite()` for WP.com detection
- Store selectors via `useSelect( select => select( STORE_ID ).selectorName(), [] )` — always include `[]` dependency array

## Instant Search redux store

Instant Search has its own `redux` store (`src/instant-search/store/`) with `refx` middleware,
separate from the `@wordpress/data` stores the dashboard and blocks use.

The store is seeded at the mount site before the first render — `initializeQueryValues()` in
`src/instant-search/index.jsx`, `disableQueryStringIntegration()` in
`src/customberg/components/app-wrapper/index.jsx`. Keep it that way: never dispatch from a
component constructor or a render method. A store write during the render phase is what caused
an infinite render loop in the Jetpack plugin's react-redux 9 upgrade (#50246), and the two
bundles here run different React implementations (preact/compat for Instant Search, real React
18 for Customberg) which handle it differently.

`tests/preact/` runs react-redux against preact/compat via `jest.preact.config.js`, since the
main Jest config uses real React and cannot catch a regression on the shipping runtime. Run it
with `pnpm test-preact`.

## Testing

Always run these when changing search code:

```bash
# JS tests (from projects/packages/search/)
pnpm test-scripts

# react-redux against preact/compat, the Instant Search runtime
pnpm test-preact

# Search PHP tests
jetpack test php packages/search -v

# Sync PHP tests — search changes often affect the sync whitelist
jetpack test php packages/sync -v
```

- Mock external packages in tests; mock custom hooks (`hooks/use-*`) rather than their internals
