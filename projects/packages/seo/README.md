# Jetpack SEO

The visibility command center for WordPress sites in the agentic web — a unified wp-admin screen that consolidates SEO, sitemaps, AI discoverability, and site verification settings across all site types (self-hosted, Atomic/WoW, Simple).

This package is built up across a stacked series of PRs (see #48154 for the split plan). It currently provides, on a wp-admin page registered at `admin.php?page=jetpack-seo` (gated on the `seo-tools` module being active):

- **Overview** — a dashboard with **Site visibility**, **Site verification**, and **Content SEO** cards. The first two deep-link into the matching Settings sections; Content SEO shows factual coverage rings (custom description, schema type set) with literal counts.
- **Settings** — a tab to configure search-engine indexing, the XML sitemap, post title structure, the front-page description, and site verification codes.
- **Content** — a DataViews list of published posts and pages showing each post's SEO state (schema type, meta description set, search visibility). Rows link to the Gutenberg editor and open an inline **Edit SEO** modal (custom title, description, schema type, noindex, SERP preview). Filters for post type, schema type, description state, and search visibility run client-side over the merged set. The Schema type control and SEO columns also appear in the block editor and `edit.php` post-list tables respectively. JSON-LD (Article / FAQ) is emitted on `wp_head`.

The AI (llms.txt / AI crawlers) tab lands in a follow-up PR.

## Architecture

Built as a [`@wordpress/build`](https://www.npmjs.com/package/@wordpress/build) (wp-build) dashboard, the pattern shared by recently-shipped Jetpack admin pages (Podcast, Scan, Forms, Newsletter):

- **PHP:** `Automattic\Jetpack\SEO\Initializer` registers the admin menu via `Admin_Menu::add_menu()`, loads wp-build's generated bundle (`build/build.php` + `WP_Build_Polyfills::register()`), and bootstraps the app's initial state. Because the user-facing slug (`jetpack-seo`) differs from wp-build's page slug (`jetpack-seo-dashboard`), the screen id is aliased on `current_screen` so wp-build's auto-generated enqueue callback fires.
- **React:** an ES-module bundle. Routing uses [`@wordpress/route`](https://www.npmjs.com/package/@wordpress/route); the Overview, Settings, and Content tabs are `?tab=`-driven panels. `_inc/app.tsx` wraps them in the `AdminPage` chrome from `@automattic/jetpack-components`. UI uses `@wordpress/components`, `@wordpress/ui`, and `@wordpress/icons`.
- **Data:** read-only initial state for the Overview and Settings tabs is bootstrapped server-side onto `window.JetpackScriptData.seo.{overview,settings}` via the `jetpack_admin_js_script_data` filter (`Initializer::inject_script_data()`) and read synchronously on the client through `@automattic/jetpack-script-data`. wp-build pages load as ES modules, so `wp_localize_script` can't bootstrap them — the script-data layer is the supported channel. The Content tab fetches posts and pages live from **core `/wp/v2/posts` and `/wp/v2/pages`** (no custom endpoint), with SEO meta returned via registered `show_in_rest` post meta. Writes in the Edit SEO modal go through the same core post endpoint. The package registers **no REST controller of its own**: Settings writes reuse `/jetpack/v4/settings` (and core `/wp/v2/settings` for `blog_public`).

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
