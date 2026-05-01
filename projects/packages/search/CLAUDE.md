# Jetpack Search — Claude Notes

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

## Testing

- JS: `pnpm test-scripts` (from `projects/packages/search/`)
- PHP: `jetpack test php packages/search -v` (from monorepo root)
- Mock external packages in tests; mock custom hooks (`hooks/use-*`) rather than their internals
