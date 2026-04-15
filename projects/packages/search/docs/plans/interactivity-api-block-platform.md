# Jetpack Search — Interactivity API Block Platform

**Date:** 2026-04-15
**Author:** Greg Ichneumon Brown
**Status:** Draft

---

## Summary

Replace the Preact/Redux instant search overlay with a composable WordPress block system powered by the WordPress Interactivity API. The new blocks connect to the existing Jetpack Search API (v1.3), support server-side rendering, and are designed as a developer platform that any plugin or team can extend. The existing overlay is left unchanged during the transition; both implementations coexist until the overlay is rewritten as a block-editor template part in a later phase.

---

## Background and Motivation

Jetpack Search currently provides two UIs:

- **Instant Search overlay** — a Preact + Redux modal rendered as a React portal to `document.body`. Configured via a custom Customizer editor. Fast and mobile-optimised, but a popover that breaks out of the site design, with no block editor integration.
- **Inline Search** — shipped in the WP.com Foundation PT (May 2025); uses the v1.3 API but renders server-side with minimal JS.

Both share the same Elasticsearch backend via the v1.3 search API, which supports full `WP_Query`-style queries, filters, aggregations, and sorting.

Key gaps driving this work:

1. **WooCommerce**: Merchants need inline faceted search (sidebar filters + live product grid) integrated into their shop and archive page templates, not a popover. The existing overlay doesn't fit merchant storefronts.
2. **Block editor**: No Gutenberg blocks exist for search. Users cannot place search UI anywhere in their templates.
3. **Extensibility**: There is no documented way for other plugins to build on Jetpack Search. Custom taxonomies and post meta require a PR to `packages/sync/src/modules/class-search.php`.
4. **Platform**: Jetpack Search should be a platform that teams (WooCommerce, VIP, third-party plugin developers) can build on top of — not a closed feature.

### Related Work

- [PT: Fix Search on WP.com Discovery and Foundation](https://datalinkp2.wordpress.com/2025/01/30/pt-fix-search-on-wp-com-discovery-and-foundation/) — shipped the v1.3 API and Inline Search
- [Support WC product filtering by Jetpack Search](https://jetpackdatap2.wordpress.com/2024/07/09/support-wc-product-filtering-by-jetpack-search/) — proposal for WooCommerce faceted search
- [Feasibility Review: Jetpack Search for Woo Marketplace](https://woomarketplace.wordpress.com/2026/03/24/feasibility-review-jetpack-search-for-woo-marketplace/) — identified gaps: no visual config UI, limited e-commerce customisation

---

## Goals

1. Ship composable Gutenberg blocks that any site can use to build a search UI in the block editor.
2. Replace the need for the overlay on WooCommerce stores with a native inline experience.
3. Lay the foundation for the overlay itself to eventually be rewritten using these same blocks.
4. Make it easy for other plugins and teams to extend Jetpack Search with custom filter blocks and custom indexed fields.
5. Establish a local development workflow so contributors can work on search features effectively.

## Non-Goals

- Replacing the existing overlay in the short term. It continues to work and receive maintenance fixes.
- Building a visual merchandising / admin configuration UI (the gap identified in the Woo Marketplace review). That is a separate project.
- Replicating every Customizer-based configuration option in the block editor immediately. Block patterns cover the most common cases.

---

## Architecture

### Two Integration Paths

The full design has two complementary paths that share the same Elasticsearch index.

#### Path A — Jetpack Interactivity API Blocks (Phases 1 & 2)

New composable blocks powered by the WordPress Interactivity API. All blocks share a namespaced `jetpack-search` store. Any block can read or write state; state changes automatically propagate to all other blocks on the page.

```
[Input blocks]       [Filter blocks]      [WC Filter blocks]
Search Input         Category             Price Range
Active Filters  -->  Tag            -->   Attribute
Sort Control         Post Type            Rating
Results Count        Author               Stock Status
                     Date
                       |
                       v
              [jetpack-search store]
              wp_interactivity_state()
              state: query, filters, results,
                     aggregations, sort, pagination
              actions: search(), setFilter(),
                       clearFilters(), loadMore()
                       |
                       v
              [Search API v1.3]
              public-api.wordpress.com/rest/v1.3/sites/{id}/search
              returns: results + aggregations (facet counts)
                       |
                       v
              [Display blocks]
              Search Results (generic)
              Product Results (WC)
              Load More / Pagination
              No Results
```

**Browse mode** is a first-class concern. The store can be initialized from PHP context (current WC category, tag, or taxonomy) with no search query. Filter blocks show live facet counts and results render immediately. This is how WooCommerce shop and archive pages work — customers browse by filtering, not by typing.

**URL state sync**: The store syncs its state to URL params (`?s=query&filter[category]=boots`) on every change. This enables shareable URLs, back/forward navigation, and server-side rendering of the initial state on page load. For the overlay (eventually), a modal param (`?jetpack-search=open`) tracks whether the modal is visible.

#### Path B — WP_Query → ES Bridge (Phase 3)

A fork of [`alleyinteractive/es-wp-query`](https://github.com/alleyinteractive/es-wp-query) intercepts `WP_Query` at the PHP level before it hits MySQL and redirects the query to the WPCOM API for translation to Elasticsearch DSL. This makes any `WP_Query` consumer — including WooCommerce's own Products block, native WC filter blocks, and any third-party plugin — automatically ES-backed without code changes.

The SQL-to-ES translation runs on the WPCOM API side, not in the plugin. The plugin only needs to intercept `WP_Query` and make the API call.

**Important**: `WP_Query` has no concept of aggregations (facet counts). Path A Jetpack filter blocks are still required for "Boots (42)" style counts. On WC shop/archive pages, the typical setup combines both paths:

- Jetpack filter blocks (Path A) provide ES-powered facet counts and write filter state to URL/query vars
- WC Products block re-renders via `WP_Query` (Path B) when URL state changes, getting ES results transparently

### Relationship with the Existing Overlay

The existing Preact/Redux overlay (`src/instant-search/`) is not touched in Phases 1–3. Both implementations coexist.

**Long-term vision (Phase 4)**: The overlay shell is rewritten as a block editor template part — a `<dialog>` container that hosts the same Phase 1/2 blocks. Users edit the overlay content in the block editor instead of the Customizer. The Preact/Redux bundle is deprecated. The overlay remains valuable as a layout choice (mobile-optimised, breaks out of site design) but is powered by the same blocks as the inline experience.

### Key Invariants Across Both Paths

- The `jetpack-search` store namespace is stable and documented as a public API.
- All blocks on a page share one store instance — placing a filter block anywhere on the page (sidebar, header, inline) connects it automatically.
- Any page type is supported: `/?s=`, `/search/`, WooCommerce shop/archive, WooCommerce search page, and (eventually) the overlay modal on any page.

---

## Implementation

### Phase 1 — Foundation

**Goal**: A working set of blocks sufficient to replace the overlay on a standard WordPress search page. Ship the "Blog Search Page" block pattern as the end-to-end proof.

#### Directory Structure

```
projects/packages/search/src/
  search-blocks/
    block.json               # shared block registration config
    index.php                # block registration entry point
    store/
      index.js               # Interactivity API store (jetpack-search namespace)
      api.js                 # search API calls (v1.3 endpoint)
      url-state.js           # URL ↔ store sync
    blocks/
      search-input/
        block.json
        render.php           # server-side render + wp_interactivity_state()
        view.js              # viewScriptModule (ES module)
        style.scss
      search-results/
        block.json
        render.php
        view.js
        style.scss
      filter-category/
        block.json
        render.php
        view.js
        style.scss
      filter-tag/            # same structure
      filter-post-type/
      filter-author/
      filter-date/
      active-filters/
      sort-control/
      results-count/
      no-results/
      load-more/
    patterns/
      blog-search.php        # "Blog Search Page" pattern
    AGENTS.md                # developer guide for adding blocks
```

#### Build Pipeline

New webpack target `webpack.blocks.config.js` separate from `webpack.instant.config.js`. The Interactivity API requires ES modules (`viewScriptModule` in `block.json`), which is incompatible with the CommonJS output of the existing Preact build. The new target uses `@wordpress/dependency-extraction-webpack-plugin` to externalize WordPress packages and outputs ES modules.

```js
// block.json (example for search-input)
{
  "name": "jetpack/search-input",
  "viewScriptModule": "file:./view.js",
  "supports": { "interactivity": true }
}
```

#### Interactivity API Store

The store is initialized server-side in each block's `render.php` via `wp_interactivity_state()`. This provides the initial query, results, and aggregations so the page is fully rendered before any JS runs.

```php
// render.php for search-results block (simplified)
// wp_interactivity_state() merges, so individual filter blocks can also add
// their own slice of state without overwriting results. The initial API call
// is made here since this block owns result rendering.
// API routing (public API vs WPCOM origin vs Atomic) follows the same
// conditional logic as the existing overlay in src/instant-search/lib/api.js,
// passed in via $api_root.
wp_interactivity_state( 'jetpack-search', array(
    'apiRoot'       => $api_root,   // routed by Helper::get_search_api_url()
    'siteId'        => Jetpack_Options::get_option( 'id' ),
    'nonce'         => wp_create_nonce( 'wp_rest' ),
    'searchQuery'   => get_search_query(),
    'activeFilters' => array(),
    'results'       => $initial_results,   // pre-fetched server-side
    'aggregations'  => $initial_aggs,
    'totalResults'  => $total,
    'isLoading'     => false,
) );
```

The client-side store (`store/index.js`) uses async generator actions for all API calls. Global state is accessed via closure — not `getContext()`, which is for per-block local context:

```js
// store/index.js
import { store } from '@wordpress/interactivity';

const { state, actions } = store( 'jetpack-search', {
    actions: {
        *search() {
            state.isLoading = true;
            const response = yield apiFetch({ path: buildSearchPath( state ) });
            state.results = response.results;
            state.aggregations = response.aggregations;
            state.totalResults = response.total;
            state.isLoading = false;
            actions.syncToUrl();
        },
        *setFilter( key, value ) {
            state.activeFilters = { ...state.activeFilters, [ key ]: value };
            yield actions.search();
        },
        clearFilters() {
            state.activeFilters = {};
            actions.search();
        },
        *loadMore() { /* appends next page via state.pageHandle */ },
        syncToUrl() { /* pushes state to URL params */ },
    },
} );
```

#### Block Patterns (Phase 1)

- **Blog Search Page**: Search input + sort control + results count in header row; category filter + tag filter + post type filter in left sidebar; search results in main content; load more at bottom; no results fallback.

#### Phase 1 Block List

| Block | Description |
|---|---|
| `jetpack/search-input` | Text input, debounced, triggers `actions.search()` |
| `jetpack/search-results` | Renders result list from `state.results`; generic (post title, excerpt, date) |
| `jetpack/filter-category` | Checkbox list from `state.aggregations.category`; facet counts shown |
| `jetpack/filter-tag` | Same pattern as category |
| `jetpack/filter-post-type` | Radio or checkbox by post type |
| `jetpack/filter-author` | Checkbox list by author |
| `jetpack/filter-date` | Year/month picker |
| `jetpack/active-filters` | Pills showing active filters with clear buttons |
| `jetpack/sort-control` | Dropdown: relevance, date, etc. |
| `jetpack/results-count` | "Showing 1–10 of 47 results" |
| `jetpack/no-results` | Shown when `state.results.length === 0 && !state.isLoading` |
| `jetpack/load-more` | Appends next page; `state.pageHandle` used for cursor pagination |

---

### Phase 2 — WooCommerce Blocks

**Goal**: Full WooCommerce product search and filtering. Ship "WooCommerce Search Page", "WooCommerce Shop Archive", and "WooCommerce Overlay" block patterns.

**Browse mode**: The store initializes from WC archive context (current category, tag, or attribute archive) with no search term when placed on a WC shop/archive page. A `render.php` prop controls whether to require a query before showing results (`mode: search | browse`).

#### Phase 2 Block List

| Block | Description |
|---|---|
| `jetpack/filter-price` | Price range slider; maps to `wc.price` ES field |
| `jetpack/filter-attribute` | Per-attribute checkbox filter (color, size, etc.); dynamic from `aggregations.product_attribute` |
| `jetpack/filter-rating` | Star rating filter; maps to `meta._wc_average_rating` |
| `jetpack/filter-stock-status` | In stock / out of stock / on backorder |
| `jetpack/search-results-product` | WC product card: image, title, price, rating, add-to-cart button |

#### Block Patterns (Phase 2)

- **WooCommerce Search Page**: Search input + WC product results + price/attribute/rating filters in sidebar.
- **WooCommerce Shop Archive**: Browse-mode; price filter + attribute filter + stock filter in sidebar; product results grid in main content. No search input required.
- **WooCommerce Overlay**: Same blocks as WC Search Page assembled in a modal template part; replaces the current overlay's WooCommerce mode.

---

### Phase 3 — WP_Query → ES Bridge

**Goal**: Any `WP_Query` consumer — WC Products block, WC native filter blocks, third-party plugins — gets ES results transparently.

Fork `alleyinteractive/es-wp-query` into `projects/packages/search/src/wp-query-bridge/`. Key changes from upstream:

- Instead of connecting directly to an ES cluster, serialize the `WP_Query` args and send them to the WPCOM API, which performs the SQL-to-ES translation server-side. This keeps ES connection details out of the plugin and reuses the existing WPCOM API infrastructure.
- Support WooCommerce-specific query args: `tax_query` on `product_cat`/`product_tag`, `meta_query` for price range (`_price`), `product_attribute` filters.
- Return `WP_Post`-compatible objects so callers require no changes.

**Aggregations gap**: `WP_Query` has no aggregations concept. Jetpack filter blocks (Path A) are still required for facet counts on WC shop pages. A `jetpack_search_prefetch_aggregations` filter lets the bridge request aggregations alongside the main query when Jetpack filter blocks are present on the page.

**Activation**: The bridge activates only when Jetpack Search is active and the site has a valid plan. Non-search `WP_Query` calls (e.g., `WP_Query` with `post_status=draft`) fall back to MySQL silently.

---

### Phase 4 — Overlay Rewrite

**Goal**: Replace the Preact/Redux overlay and its Customizer editor with a block editor template part.

- A new "Jetpack Search Overlay" template part is registered. It contains the same blocks as the WooCommerce Overlay pattern by default.
- The overlay shell (`src/instant-search/components/overlay.jsx`) is replaced with a thin PHP/JS wrapper that renders the template part inside a `<dialog>` element, managed by a small Interactivity API store action.
- The Customizer integration (`src/customberg/`) is deprecated and eventually removed.
- The Preact/Redux bundle (`src/instant-search/`) is marked deprecated and removed once overlay traffic on the new implementation reaches parity.

---

### Phase 5 — Developer Platform

**Goal**: Make Jetpack Search a platform that other plugins and teams can build on top of with minimal friction.

#### Indexing Registration API

Currently, adding a new postmeta key or taxonomy to the search index requires a PR to `packages/sync/src/modules/class-search.php`. The static allowlists `$postmeta_to_sync` and `$taxonomies_to_sync` control both what gets synced and what `is_indexable()` returns.

**Escape hatches (available now)**: `jetpack-search-meta0` through `jetpack-search-meta9` and `jetpack-search-tag0` through `jetpack-search-tag9` are reserved generic slots plugins can map custom fields into without a core PR.

**New registration API**:

```php
// Plugin registers a custom field for indexing
jetpack_search_register_postmeta( 'my_plugin_color', array(
    'type'    => 'text',  // or 'long', 'double', 'boolean'
    'index'   => array(),
) );

jetpack_search_register_taxonomy( 'my_plugin_collection' );
```

`jetpack_search_register_postmeta()` hooks into both `jetpack_sync_post_meta_whitelist` (so the field is synced) and dynamically extends `is_indexable()` (so the WPCOM indexer includes it). A re-index is required for existing posts to appear — the registration API emits an admin notice warning and links to the re-index process.

#### Block Scaffolding

A `@wordpress/create-block` template (`create-jetpack-search-block`) scaffolds a new filter block or result block:

```bash
pnpm create @wordpress/block --template @automattic/jetpack-search-block
```

Generated files:
- `block.json` with `viewScriptModule` and `supports.interactivity: true`
- `render.php` that calls `wp_interactivity_state()` and reads aggregations
- `view.js` that imports the `jetpack-search` store and registers `wp-interactive` directives
- Registration call to `jetpack_search_register_postmeta()` or `jetpack_search_register_taxonomy()`
- Basic Jest test
- `CHANGELOG.md` entry placeholder

#### AGENTS.md

`src/search-blocks/AGENTS.md` documents the full developer workflow for AI coding assistants:

- How to add a filter block (all files, PHP hook, `block.json` fields)
- How to add a result renderer (slot/fill pattern)
- How the `jetpack-search` store works (state shape, all actions)
- The two-step indexing process: register for sync + register for indexing
- The re-index requirement when adding new fields
- How to run local tests (Docker + Jurassic Ninja)
- Link to the block scaffolding tool

#### Store Extensibility

The `jetpack-search` Interactivity API store namespace is documented as a public API from Phase 1. Third-party blocks can read from it without owning it:

```js
import { store } from '@wordpress/interactivity';
const { state, actions } = store( 'jetpack-search' );
// read state.results, call actions.setFilter(), etc.
```

A `jetpack_search_store_config` PHP filter allows plugins to inject additional initial state keys (e.g., custom sort options, custom result fields to fetch).

---

## Local Development Setup

### Docker (full local environment)

```bash
# Start WordPress with Jetpack
jetpack docker up -d
jetpack docker install   # first time only

# Build search blocks in watch mode
cd projects/packages/search
pnpm watch

# Browse to http://localhost:8888
# Enable Jetpack Search in wp-admin → Jetpack → Settings → Performance
```

The Docker environment at `tools/docker/` includes WooCommerce support. To test with WooCommerce:

```bash
jetpack docker wp plugin install woocommerce --activate
jetpack docker wp wc tool run install_pages --user=1
```

### Jurassic Ninja (quick WooCommerce config testing)

For testing different WooCommerce configurations (themes, product counts, attribute setups) without local Docker overhead, use the `jetpack-test-jurassic-ninja` skill to rsync the search package to a live Jurassic Ninja site:

```bash
# from Claude Code
/jetpack-test-jurassic-ninja
```

This is especially useful for testing the WC shop/archive block patterns across different themes and product configurations.

### Build commands

```bash
pnpm build           # build everything
pnpm build-instant   # existing overlay only
pnpm build-blocks    # new blocks only (Phase 1+)
pnpm watch           # watch all targets
pnpm test            # Jest unit tests
```

---

## Open GitHub Issues

There are many open issues tagged `[Feature] Search` that the Interactivity API blocks will close or address. The block-based approach specifically resolves issues related to:

- Inline/embedded search (not just overlay)
- WooCommerce product filtering
- Template/theme incompatibilities with the overlay portal
- Customizer configuration complexity
- Mobile layout issues on custom themes

A triage pass against [open Search issues](https://github.com/Automattic/jetpack/issues?q=is%3Aissue+state%3Aopen+label%3A%22%5BFeature%5D+Search%22) should be done at the start of Phase 1 to tag which issues each block addresses and can be closed when that block ships.

---

## Testing Strategy

- **Unit tests (Jest)**: Store actions and reducers (search, setFilter, clearFilters, loadMore, URL sync). Mock the fetch call.
- **PHP tests**: `render.php` output for each block; `wp_interactivity_state()` output; `jetpack_search_register_postmeta()` hook behaviour; `is_indexable()` extension.
- **E2E**: Block editor: place blocks, configure via inspector; Frontend: search, filter, browse mode, URL state, back/forward navigation; WooCommerce: shop page filter → product grid updates; Overlay: modal open/close, URL param.
- **Size limit**: New blocks target must not regress the existing instant search bundle size limit (defined in `package.json` → `size-limit`).

---

## Key Constraints and Risks

1. **Indexing requires WPCOM coordination**: Adding new postmeta keys or taxonomies to the index requires both a plugin-side change and a WPCOM-side re-index. The registration API (Phase 5) mitigates this for future additions but cannot retroactively index existing posts without a re-index job.

2. **ES module build requirement**: The Interactivity API's `viewScriptModule` requires ES module output. This is a different build target from the existing Preact bundle. WordPress 6.5+ is required for `viewScriptModule` support.

3. **Aggregations not available via WP_Query**: The Path B (es-wp-query) bridge cannot provide facet counts. Jetpack filter blocks (Path A) are always required for filter UI, even when the product grid uses Path B.

4. **Overlay Customizer migration**: The Customizer-based overlay configuration has no direct equivalent in the block editor. Users who have customised the overlay will need to rebuild their configuration as a block pattern. A migration guide and import tool should be planned for Phase 4.

5. **Bundle size**: The existing instant search overlay has a strict bundle size limit enforced by `size-limit` in CI. New blocks must not bloat the overall package. Each block's `view.js` is loaded only on pages where that block is rendered.
