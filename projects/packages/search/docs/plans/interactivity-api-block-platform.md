# Jetpack Search 3.0 — Interactivity API Block Platform

**Date:** 2026-04-15
**Author:** Greg Ichneumon Brown
**Status:** Draft

---

## Summary

This spec covers steps 1 and 2 of the [Jetpack Search 3.0 project](https://radicalupdates.wordpress.com/2026/04/15/jetpack-search-3-0/): build a composable WordPress block system powered by the WordPress Interactivity API that connects to the Jetpack Search v1.3 API. The new blocks support server-side rendering and are designed as a developer platform that any plugin or team can extend. The existing overlay is left unchanged during the transition; both implementations coexist until the overlay is rewritten as a block-editor template part in a later phase.

---

## Background and Motivation

Jetpack Search currently provides two UIs:

- **Instant Search overlay** — a Preact + Redux modal rendered as a React portal to `document.body`. Configured via a custom Customizer editor. Fast and mobile-optimised, but a popover that breaks out of the site design, with no block editor integration.
- **Inline Search** — shipped in the WP.com Foundation PT (May 2025); renders server-side with minimal JS. Uses the v1.3 API, but sites were never fully transitioned to it from v1.0.

### Search API Versions

Jetpack Search has two distinct API versions with important differences:

- **v1.0 (Classic Search)** — uses the **global Elasticsearch index** shared across all WP.com sites. Accepts relatively arbitrary ES queries passed through from the plugin. The vast majority of sites — ~264k Business/Commerce plan sites and ~100k+ standalone Classic Search plan sites — are still on this API. Has been in production for 10+ years.
- **v1.3** — uses the **jetpack-search index**, a site-specific index that is smaller and faster to rebuild. Accepts only query string, filters, and aggregations — not arbitrary ES queries. Currently serves ~81k sites; the Foundation PT set up the infrastructure for Inline Search using v1.3, but the full site migration from v1.0 to v1.3 has not happened. This is the API the new blocks will call.

The new Interactivity API blocks target the v1.3 API exclusively.

Key gaps driving this work:

1. **WooCommerce**: Merchants need inline faceted search (sidebar filters + live product grid) integrated into their shop and archive page templates, not a popover. The existing overlay doesn't fit merchant storefronts.
2. **Block editor**: No Gutenberg blocks exist for search. Users cannot place search UI anywhere in their templates.
3. **Extensibility**: There is no documented way for other plugins to build on Jetpack Search. Custom taxonomies and post meta require a PR to `packages/sync/src/modules/class-search.php`.
4. **Platform**: Jetpack Search should be a platform that teams (WooCommerce, VIP, third-party plugin developers) can build on top of — not a closed feature.

### Related Work

- [Jetpack Search 3.0 Project Overview](https://radicalupdates.wordpress.com/2026/04/15/jetpack-search-3-0/) — this spec covers steps 1 and 2
- [PT: Fix Search on WP.com Discovery and Foundation](https://datalinkp2.wordpress.com/2025/01/30/pt-fix-search-on-wp-com-discovery-and-foundation/) — shipped the v1.3 API and Inline Search infrastructure
- [Support WC product filtering by Jetpack Search](https://jetpackdatap2.wordpress.com/2024/07/09/support-wc-product-filtering-by-jetpack-search/) — proposal for WooCommerce faceted search
- [Feasibility Review: Jetpack Search for Woo Marketplace](https://woomarketplace.wordpress.com/2026/03/24/feasibility-review-jetpack-search-for-woo-marketplace/) — identified gaps: no visual config UI, limited e-commerce customisation
- [Fixing the Jetpack Search offering on WP.com](https://jetpackp2.wordpress.com/2024/12/04/fixing-the-jetpack-search-offering-on-wp-com/) — analysis of the 264k Business/Commerce sites on Classic Search v1.0 and proposed path to inline search
- [Jetpack Search Architecture and Next Steps](https://jetpacksearch.wordpress.com/2025/01/29/jetpack-search-architecture-and-next-steps/) — deep dive on v1.0 vs v1.3 API differences, global index vs jetpack-search index, and migration challenges
- [Discuss: Gutenberg + Jetpack Search](https://tumblrspiritp2.wordpress.com/2020/11/26/discuss-gutenberg-plus-jetpack-search/) — early discussion of block-based search direction (2020)
- [WCEU 2024 Woo Booth Staff Feedback](https://woocommunityevents.wordpress.com/2024/06/17/wceu-2024-woo-booth-staff-feedback-requested/#comment-2112) — real merchant requests driving the WooCommerce filtering work

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
[Input blocks]       [Filter blocks]           [WC Filter blocks (Phase 2)]
Search Input         filter-checkbox           Price Range
Active Filters  -->    • category variation    Attribute variation
Sort Control           • tag variation    -->  Rating
Results Count          • post-type variation   Stock Status variation
                       • author variation
                       • custom variation
                     filter-date (Phase 2)
                       |
                       v
              [jetpack-search store]
              wp_interactivity_state()
              state: query, filters, results,
                     aggregations, filterConfigs, sort, pagination
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
    class-search-blocks.php  # block registration + wp_interactivity_state() seeding
    store/
      index.js               # Interactivity API store (jetpack-search namespace)
      api.js                 # v1.3 API client; buildAggregations/buildFilters read filterConfigs
      url-state.js           # URL ↔ store sync
    blocks/
      search-input/
        block.json
        render.php           # server-side render + wp_interactivity_state()
        view.js              # viewScriptModule (ES module)
        style.scss
      search-results/
        block.json
        render.php           # pre-fetches initial results server-side
        view.js
        style.scss
      filter-checkbox/       # one block handles all checkbox-style filtering
        block.json           # attributes: filterType, taxonomy, metaKey, displayMode, curatedValues, label, showCount, maxItems
        class-filter-checkbox.php  # derive_filter_key(), derive_es_field(), get_initial_items()
        render.php           # registers FilterConfig into wp_interactivity_state(); renders checkbox list
        view.js              # isChecked + count derived state; reads filterKey/itemValue from per-item context
        variations.js        # editor-side: registerBlockVariation for Category, Tag, Post Type, Author, Custom Taxonomy, Custom Field
        style.scss
      filter-date/           # separate block — different UI (date range picker)
        block.json
        render.php
        view.js
        style.scss
      active-filters/
        block.json
        render.php
        view.js
        style.scss
      sort-control/
        block.json
        render.php
        view.js
        style.scss
      results-count/
        block.json
        render.php           # display only, no view.js
        style.scss
      no-results/
        block.json
        render.php           # display only, no view.js
      load-more/
        block.json
        render.php
        view.js
        style.scss
    patterns/
      blog-search.php        # "Blog Search Page" pattern
    AGENTS.md                # developer guide for adding blocks and filter variations
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
    'filterConfigs' => array(),  // each filter block merges its own entry at render time
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
        *setFilter( filterKey, filterValue ) {
            // activeFilters maps filterKey → array of selected values
            const current = state.activeFilters[ filterKey ] ?? [];
            state.activeFilters = { ...state.activeFilters, [ filterKey ]: [ ...current, filterValue ] };
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

- **Blog Search Page**: Search input + sort control + results count in header row; `filter-checkbox` (category variation) + `filter-checkbox` (tag variation) + `filter-checkbox` (post-type variation) in left sidebar; search results in main content; load more at bottom; no results fallback.

#### Phase 1 Block List

| Block | Type | Description |
|---|---|---|
| `jetpack/search-input` | Block | Text input, debounced, triggers `actions.search()` |
| `jetpack/search-results` | Block | Renders result list from `state.results`; generic (post title, excerpt, date) |
| `jetpack/filter-checkbox` | Block | Checkbox filter — one block handles all checkbox-style filtering (see variations below) |
| `jetpack/filter-checkbox` — Category | Variation | `filterType: taxonomy, taxonomy: category`; dynamic (terms agg) |
| `jetpack/filter-checkbox` — Tag | Variation | `filterType: taxonomy, taxonomy: post_tag`; dynamic |
| `jetpack/filter-checkbox` — Post Type | Variation | `filterType: post_type`; dynamic |
| `jetpack/filter-checkbox` — Author | Variation | `filterType: author`; dynamic |
| `jetpack/filter-checkbox` — Custom Taxonomy | Variation | `filterType: taxonomy, taxonomy: {slug}`; user sets taxonomy in inspector |
| `jetpack/filter-checkbox` — Custom Field | Variation | `filterType: post_meta, metaKey: {key}, displayMode: curated`; user configures values |
| `jetpack/filter-date` | Block | Year/month picker — separate block (different UI) |
| `jetpack/active-filters` | Block | Pills showing active filters with clear buttons |
| `jetpack/sort-control` | Block | Dropdown: relevance, date, etc. |
| `jetpack/results-count` | Block | "Showing 1–10 of 47 results" |
| `jetpack/no-results` | Block | Shown when `state.results.length === 0 && !state.isLoading` |
| `jetpack/load-more` | Block | Appends next page; `state.pageHandle` used for cursor pagination |

**`filterConfigs` pattern**: Each `filter-checkbox` block's `render.php` registers a `FilterConfig` into `state.filterConfigs` via `wp_interactivity_state()`. Shape: `{ filterKey, esField, aggType: 'terms'|'filters', curatedValues, showCount, maxItems }`. The JS store reads `filterConfigs` to build aggregation requests and ES filter clauses — PHP owns the field mapping, JS executes it. This is the extension point: adding a new filter type only requires knowing the ES field name.

---

### Phase 2 — WooCommerce Blocks

**Goal**: Full WooCommerce product search and filtering. Ship "WooCommerce Search Page", "WooCommerce Shop Archive", and "WooCommerce Overlay" block patterns.

**Browse mode**: The store initializes from WC archive context (current category, tag, or attribute archive) with no search term when placed on a WC shop/archive page. A `render.php` prop controls whether to require a query before showing results (`mode: search | browse`).

#### Phase 2 Block List

| Block | Type | Description |
|---|---|---|
| `jetpack/filter-price` | Block | Price range slider; different UI → separate block. Maps to `wc.price` ES field |
| `jetpack/filter-checkbox` — WC Attribute | Variation | `filterType: taxonomy, taxonomy: pa_{attribute}`; dynamic; adds WC attribute ES field mapping to `Filter_Checkbox::ES_FIELDS` |
| `jetpack/filter-checkbox` — Stock Status | Variation | `filterType: post_meta, metaKey: _stock_status, displayMode: curated, curatedValues: [instock, outofstock, onbackorder]`; no new block needed |
| `jetpack/filter-rating` | Block | Star rating filter; different UI (visual stars) → separate block. Maps to `meta._wc_average_rating` |
| `jetpack/search-results-product` | Block | WC product card: image, title, price, rating, add-to-cart button |

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

**Goal**: Let site owners (and plugins) extend search with custom post meta fields, and provide a stable platform for other plugins and teams to build on.

#### Why a Registration API Can't Work

WPCOM's indexer maintains its own independent allowlist of what gets indexed into Elasticsearch. Adding a field to the sync whitelist on the plugin side makes it available in WPCOM's replicastore, but it will not appear in the search index unless WPCOM's indexer also includes it — and site owners cannot deploy to the WPCOM codebase. A dynamic registration API (`jetpack_search_register_postmeta()`) therefore cannot work for site owners or third-party plugins.

#### Generic Slot System (already deployed on both sides)

`jetpack-search-meta0` through `jetpack-search-meta9` are reserved generic postmeta keys that are already in the Jetpack sync allowlist *and* already indexed by the WPCOM search indexer. No coordination is needed to use them.

The ES index maps these via dynamic templates that create typed subfields from whatever PHP type is synced:

| PHP type synced | ES subfield | Used for |
|---|---|---|
| string | `meta.<key>.value` (text) + `.value.raw` (keyword) | full-text search, exact match |
| integer | `meta.<key>.long` | numeric range, sort |
| float | `meta.<key>.float` | price, decimal range |
| boolean | `meta.<key>.boolean` | on/off flags |
| date string | `meta.<key>.date` | date range filters |

The plugin only needs to write the correctly-typed PHP value to the slot; the indexer creates the right subfield automatically.

There are also `jetpack-search-tag0` through `jetpack-search-tag9` generic *taxonomy* slots (see Taxonomy Mapping below).

#### Custom Field Mapping

Site owners configure which of their custom postmeta fields should be mirrored into which generic slot. The plugin maintains that mirror automatically at write time.

**Option**: `jetpack_search_field_mapping` (site option; does not need to be synced to WPCOM since it is only used locally):

```json
{
  "meta": {
    "0": { "source": "my_custom_color", "type": "text" },
    "3": { "source": "sale_price",      "type": "float" }
  }
}
```

`type` controls which ES subfield `filterConfigs` will use (text → `meta.jetpack-search-meta0.value.raw`, float → `meta.jetpack-search-meta3.float`, etc.).

**`Field_Mapping` class** (`src/class-field-mapping.php`):

Registers hooks and provides the query-time lookup:

```php
// Write-time mirroring: when a mapped source field changes, update the slot.
// The slot is a real wp_postmeta row — existing Jetpack sync picks it up via
// its normal updated_post_meta hook. No sync module changes are needed.
add_action( 'updated_post_meta', array( $this, 'mirror_postmeta_change' ), 10, 4 );
add_action( 'added_post_meta',   array( $this, 'mirror_postmeta_change' ), 10, 4 );
add_action( 'deleted_post_meta', array( $this, 'mirror_postmeta_delete' ), 10, 4 );

// Returns the full ES field path for a source field, or null if not mapped.
// e.g. 'my_custom_color' (type=text) → 'meta.jetpack-search-meta0.value.raw'
//      'sale_price'       (type=float) → 'meta.jetpack-search-meta3.float'
public function get_es_field( string $source_key ): ?string { ... }
```

**Code-based registration** (for plugins shipping predefined mappings):

```php
// In plugin bootstrap — same effect as a DB entry, but not user-editable.
// Shown read-only in the settings UI: "Registered by plugin."
add_action( 'jetpack_search_register_field_mappings', function( $mapping ) {
    $mapping->register( 'my_plugin_color', 'meta', 0, 'text' );
    $mapping->register( 'vendor_id',       'meta', 1, 'long' );
} );
```

Code-registered slots cannot be overridden by the DB mapping. The action fires before DB mappings are applied, and any slot claimed by code is shown as unavailable in the settings UI.

**Bulk sync after any mapping change**:

When the mapping is saved (or a mapping is removed), a WP-Cron event iterates all posts in batches of 100, writes the source field's current value to the mapped slot (or deletes the slot value on unmap), and records progress in a transient. Jetpack incremental sync picks up every `update_post_meta` call naturally.

```php
// Scheduled via wp_schedule_single_event() after mapping save.
public function bulk_sync_mapped_fields(): void {
    $mapping = $this->get_merged_mapping(); // code-registered + DB entries
    $offset  = 0;
    do {
        $posts = get_posts( [ 'numberposts' => 100, 'offset' => $offset, 'post_status' => 'any' ] );
        foreach ( $posts as $post ) {
            foreach ( $mapping['meta'] as $slot_num => $entry ) {
                $value = get_post_meta( $post->ID, $entry['source'], true );
                if ( $value !== '' ) {
                    update_post_meta( $post->ID, "jetpack-search-meta{$slot_num}", $value );
                } else {
                    delete_post_meta( $post->ID, "jetpack-search-meta{$slot_num}" );
                }
            }
        }
        set_transient( 'jetpack_search_field_sync_progress', $offset, HOUR_IN_SECONDS );
        $offset += 100;
    } while ( count( $posts ) === 100 );
    delete_transient( 'jetpack_search_field_sync_progress' );
}
```

**REST API** (additions to `src/class-rest-controller.php`):

- `GET  /jetpack/v4/search/field-mapping` — returns merged mapping (code + DB) and slot availability
- `PUT  /jetpack/v4/search/field-mapping` — validates, saves DB mapping, schedules bulk sync
- `GET  /jetpack/v4/search/field-mapping/sync-status` — polls bulk sync progress from transient

**Settings dashboard** (new "Custom Fields" panel):

Lists the 10 meta slots. For each slot: current source field name and type (if mapped, shown read-only if code-registered), or empty inputs to configure one. A "Save & Sync" button saves the mapping and schedules the bulk sync. A status indicator polls `/sync-status` and shows a completion notice. A warning note explains that removing a mapping also clears the slot from all posts and triggers a full re-sync.

**filter-checkbox block integration**:

PHP `render.php` calls `Field_Mapping::get_es_field($attributes['sourceField'])` at render time to produce the correct typed ES field path in `filterConfigs`. If the source field has no mapping configured, the block renders an editor notice linking to the settings page.

#### Taxonomy Slot Mapping (Phase 6)

`jetpack-search-tag0` through `jetpack-search-tag9` are registered WordPress *taxonomies*, not postmeta. Mirroring them requires `wp_set_object_terms()` on every post save, clearing old term assignments when the mapping changes. The same UI and bulk-sync pattern applies but the implementation is distinct enough to defer to Phase 6.

#### AGENTS.md

`src/search-blocks/AGENTS.md` documents the full developer workflow for AI coding assistants:

- How to add a filter-checkbox variation (new `block.json` variation entry, PHP `filterConfigs` field mapping using `Field_Mapping::get_es_field()`)
- How to add a result renderer (slot/fill pattern)
- How the `jetpack-search` store works (state shape, all actions)
- The generic slot system: `jetpack-search-meta0` through `meta9` are the only extension points; new named fields cannot be added without a WPCOM PR
- The write-time mirroring pattern and when to use code-based vs. DB-based mapping registration
- How to run local tests (Docker + Jurassic Ninja)

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

- **Unit tests (Jest)**: Store actions and derived state (search, setFilter, clearFilters, loadMore, URL sync). Mock the fetch call.
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

6. **API migration path for existing sites**: This is the largest operational risk. There are three distinct populations of sites to migrate:
   - **~264k Business/Commerce sites + ~100k+ Classic Search sites on v1.0**: These sites get Classic Search for free as part of their plan or purchased it standalone. Migrating them to the new block experience requires transitioning them to the v1.3 API (and the jetpack-search index, which needs to scale from ~81k to ~300k+ sites), re-evaluating their plan/billing entitlements, and providing a UI migration path from the overlay or inline search to the new blocks. This requires WPCOM-side capacity planning and a staged rollout strategy.
   - **~existing instant search sites on v1.3**: Sites already using the Preact/Redux overlay with the v1.3 API need a path to the new block-based UI. These sites are already on the right index but need an opt-in or migration flow to adopt the block pattern setup.
   - **Billing/plan boundaries**: The Classic Search plan and Jetpack Search plan have different feature boundaries. The new blocks should map cleanly to plan entitlements. This must be resolved before any automatic migration occurs.
   
   A phased approach is likely: new sites and opted-in sites first, bulk migration of existing sites later once the v1.3 index has scaled and the UX has been validated.
