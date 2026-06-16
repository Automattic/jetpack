# Jetpack SEO

The visibility command center for WordPress sites in the agentic web — a unified wp-admin screen that consolidates SEO, sitemaps, AI discoverability, and site verification settings across all site types (self-hosted, Atomic/WoW, Simple).

This package is built up across a stacked series of PRs (see #48154 for the split plan). It currently provides, on a wp-admin page registered at `admin.php?page=jetpack-seo` (gated on the `seo-tools` module being active):

- **Overview** — a dashboard with **Site visibility** and **Site verification** cards, each deep-linking into the matching Settings section.
- **Settings** — search-engine indexing, the XML sitemap, canonical URLs, the title structure for all page types (front page, posts, pages, tags, archives), the front-page description, and site verification codes, plus read-only search & social previews of the home page (Google / Facebook / X).
- **AI** — the AI SEO Enhancer toggle.

The Per-post SEO (Content) tab lands in a follow-up PR.

## Architecture

Built as a [`@wordpress/build`](https://www.npmjs.com/package/@wordpress/build) (wp-build) dashboard, the pattern shared by recently-shipped Jetpack admin pages (Podcast, Scan, Forms, Newsletter):

- **PHP:** `Automattic\Jetpack\SEO\Initializer` registers the admin menu via `Admin_Menu::add_menu()`, loads wp-build's generated bundle (`build/build.php` + `WP_Build_Polyfills::register()`), and bootstraps the app's initial state. Because the user-facing slug (`jetpack-seo`) differs from wp-build's page slug (`jetpack-seo-dashboard`), the screen id is aliased on `current_screen` so wp-build's auto-generated enqueue callback fires.
- **React:** an ES-module bundle. Each top-level view (Overview, Settings, AI) is its own [`@wordpress/route`](https://www.npmjs.com/package/@wordpress/route) route under `routes/`, exporting a `stage` — the per-route pattern shared with Forms. A shared shell (`_inc/dashboard/dashboard-page` + `dashboard-nav`) renders the `AdminPage` chrome from `@automattic/jetpack-components` and the route-based tab navigation, so every route gets the same header, tabs and footer. UI uses `@wordpress/components`, `@wordpress/ui`, and `@wordpress/icons`.
- **Data:** read-only initial state for the routes is bootstrapped server-side onto `window.JetpackScriptData.seo.{overview,settings,google_verify,ai,site}` via the `jetpack_admin_js_script_data` filter (`Initializer::inject_script_data()`) and read synchronously on the client through `@automattic/jetpack-script-data`. wp-build pages load as ES modules, so `wp_localize_script` can't bootstrap them — the script-data layer is the supported channel. The package registers **no REST controller of its own**: Settings writes reuse the existing `/jetpack/v4/settings` endpoint (and core `/wp/v2/settings` for the `blog_public` search-engine-visibility option).

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
