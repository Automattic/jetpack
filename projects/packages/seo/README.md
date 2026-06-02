# Jetpack SEO

The visibility command center for WordPress sites in the agentic web — a unified wp-admin screen that consolidates SEO, sitemaps, AI discoverability, and site verification settings across all site types (self-hosted, Atomic/WoW, Simple).

This package is being built up across a stacked series of PRs (see #48154 for the split plan). This foundation ships the package scaffold, the admin page, and the Overview screen's Site visibility card; the Settings, Content, and AI tabs and the remaining Overview cards land in follow-up PRs.

## What this foundation provides

- A standalone wp-admin page registered at `admin.php?page=jetpack-seo`, gated behind the `rsm_jetpack_seo` feature flag (off by default during roll-out) and, when on, the `seo-tools` module being active.
- The **Overview** screen with a single **Site visibility** card (search engines allowed, sitemap active, SEO tools active).

## Architecture

Built as a [`@wordpress/build`](https://www.npmjs.com/package/@wordpress/build) (wp-build) dashboard, the pattern shared by recently-shipped Jetpack admin pages (Podcast, Scan, Forms, Newsletter):

- **PHP:** `Automattic\Jetpack\SEO\Initializer` registers the admin menu via `Admin_Menu::add_menu()`, loads wp-build's generated bundle (`build/build.php` + `WP_Build_Polyfills::register()`), and bootstraps the app's initial state. Because the user-facing slug (`jetpack-seo`) differs from wp-build's page slug (`jetpack-seo-dashboard`), the screen id is aliased on `current_screen` so wp-build's auto-generated enqueue callback fires.
- **React:** the page is an ES-module bundle. Routing uses [`@wordpress/route`](https://www.npmjs.com/package/@wordpress/route); each route is a `routes/<name>/{route,stage}.tsx` pair. `_inc/app.tsx` wraps the routes in the `AdminPage` chrome from `@automattic/jetpack-components`. UI uses `@wordpress/components`, `@wordpress/ui`, and `@wordpress/icons`.
- **Data:** read-only initial state is bootstrapped server-side onto `window.JetpackScriptData.seo` via the `jetpack_admin_js_script_data` filter (`Initializer::inject_script_data()`) and read synchronously on the client through `@automattic/jetpack-script-data` (`_inc/data/get-overview.ts`). wp-build pages load as ES modules, so `wp_localize_script` can't bootstrap them — the script-data layer is the supported channel. There is no REST controller in this foundation.

## Development

```bash
# Build once (from the repo root)
jetpack build packages/seo

# Watch mode
pnpm --filter='@automattic/jetpack-seo' run watch

# Typecheck
pnpm --filter='@automattic/jetpack-seo' run typecheck

# Tests
pnpm --filter='@automattic/jetpack-seo' run test
```

The built JS/CSS lives in `build/` and is included in the vendored Jetpack plugin distribution via `.gitattributes` (`/build/** production-include`).
