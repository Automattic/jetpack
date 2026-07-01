# Jetpack SEO

The visibility command center for WordPress sites in the agentic web — a unified wp-admin screen that consolidates SEO, sitemaps, AI discoverability, and site verification settings across all site types (self-hosted, Atomic/WoW, Simple).

This package is built up across a stacked series of PRs (see #48154 for the split plan). It currently provides, on a wp-admin page registered at `admin.php?page=jetpack-seo` (gated on the `seo-tools` module being active):

- **Overview** — a dashboard with **Site visibility**, **Site verification**, and **Content SEO** cards. The visibility/verification cards deep-link into the matching Settings sections; Content SEO shows factual coverage rings (custom description, schema type set) with literal counts.
- **Settings** — search-engine indexing, the XML sitemap (with a "View sitemap" link once it's generated; the toggle is disabled while indexing is blocked, since a sitemap can't be served then), canonical URLs, the title structure for all page types (front page, posts, pages, tags, archives), the front-page description, and site verification codes, plus read-only search & social previews of the home page (Google / Facebook / X).
- **Content** — a DataViews list of published posts and pages showing each post's SEO state (schema type, meta description set, search visibility). Rows link to the Gutenberg editor and open a per-post **SEO inspector** (custom title, description, schema type, noindex, SERP preview) in the dashboard sidebar. Filters for post type, schema type, description state, and search visibility run client-side over the merged set. The Schema type control and SEO columns also appear in the block editor and `edit.php` post-list tables respectively. JSON-LD (Article / FAQ) is emitted on `wp_head`.
- **AI** — the AI SEO Enhancer toggle.

(llms.txt and AI-crawler management land in separate Phase 1 projects.)

## Architecture

Built as a [`@wordpress/build`](https://www.npmjs.com/package/@wordpress/build) (wp-build) dashboard, the pattern shared by recently-shipped Jetpack admin pages (Podcast, Scan, Forms, Newsletter):

- **PHP:** `Automattic\Jetpack\SEO\Initializer` registers the admin menu via `Admin_Menu::add_menu()`, loads wp-build's generated bundle (`build/build.php` + `WP_Build_Polyfills::register()`), and bootstraps the app's initial state. Because the user-facing slug (`jetpack-seo`) differs from wp-build's page slug (`jetpack-seo-dashboard`), the screen id is aliased on `current_screen` so wp-build's auto-generated enqueue callback fires.
- **React:** an ES-module bundle. Each top-level view (Overview, Settings, Content, AI) is its own [`@wordpress/route`](https://www.npmjs.com/package/@wordpress/route) route under `routes/`, exporting a `stage` — the per-route pattern shared with Forms. The Content route also exports an `inspector` (the per-post SEO editor), rendered in wp-build's native Stage/Inspector sidebar when a post is selected (`?postId=`). A shared shell (`_inc/dashboard/dashboard-page` + `dashboard-nav`) renders the `AdminPage` chrome from `@automattic/jetpack-components` and the route-based tab navigation, so every route gets the same header, tabs and footer. UI uses `@wordpress/components`, `@wordpress/ui`, and `@wordpress/icons`.
- **Data:** the Overview, Settings, and AI routes are backed by read-only REST routes `GET /jetpack/v4/seo/{overview,settings,ai}` (`Initializer::register_rest_reads()`, `manage_options`-gated), whose responses are **preloaded** into the page server-side via `rest_preload_api_request()` (`Initializer::inject_script_data()`, on the `jetpack_admin_js_script_data` filter — wp-build pages load as ES modules, so `wp_localize_script` can't bootstrap them and the script-data layer is the supported channel). On a normal load each route reads its slice from the preload synchronously through `@automattic/jetpack-script-data` (`_inc/data/get-preloaded.ts`) — instant, no request. When a slice is missing or stale (e.g. a mismatched bundle after an update), the route's stage fetches it from its REST route instead of dead-ending: `_inc/data/use-ensure-tab-data.ts` shows a loading skeleton, retries silently, and surfaces a recoverable "Try again" state only on genuine failure. `google_verify` and `site` stay synchronous on `window.JetpackScriptData.seo`. The Content route fetches posts and pages live from **core `/wp/v2/posts` and `/wp/v2/pages`** (no custom endpoint), with SEO meta returned via registered `show_in_rest` post meta; the inspector writes through the same core post endpoint. The read routes above are the package's only REST routes — **Settings writes reuse the existing `/jetpack/v4/settings` endpoint** (and core `/wp/v2/settings` for the `blog_public` search-engine-visibility option), so the package registers no write controller of its own.

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
