# Jetpack SEO

The visibility command center for WordPress sites in the agentic web — a unified wp-admin screen that consolidates SEO, sitemaps, AI discoverability, and site verification settings across all site types (self-hosted, Atomic/WoW, Simple).

## What this package provides

- A standalone wp-admin page registered at `admin.php?page=jetpack-seo`
- REST API under the `jetpack-seo/v1` namespace
- llms.txt generation and AI crawler management (free for all plans)
- Multi-surface SERP preview component shared between the admin screen, post-list popovers, and the block editor sidebar
- Expanded JSON-LD schema emitters (Article, Organization, FAQPage, HowTo, LocalBusiness)

## Architecture

Follows the pattern established by `projects/packages/my-jetpack/`:

- **PHP:** `Automattic\Jetpack\SEO\Initializer` registers the admin menu via `Admin_Menu::add_menu()` and enqueues the built React bundle
- **React:** `_inc/admin.tsx` mounts a `HashRouter` SPA using `@wordpress/components`, `@wordpress/dataviews`, `@tanstack/react-query`, and `@automattic/social-previews`
- **Data:** TanStack Query wrappers (`useSimpleQuery` / `useSimpleMutation`) consume the REST API

## Development

```bash
# Build once
pnpm run build

# Watch mode
pnpm run watch

# Tests
pnpm run test
```
