# Search Blocks

Notes for contributors (and AI agents) working in `src/search-blocks/`.

## Search experiences & server-side search

`Module_Control::get_experience()` decides who answers a front-end search, and whether the server runs a search at all:

- **Theme search (`inline`)** — the theme's own `search.html` renders results server-side. `Classic_Search` (or `Inline_Search` when `swap_classic_to_inline_search` is on) handles `posts_pre_query` and returns real Elasticsearch results.
- **Overlay (`overlay`)** — legacy preact Instant Search. `Instant_Search` short-circuits the main query (returns `[]`) and fetches results client-side.
- **Embedded (`embedded`)** — the `jetpack-search.html` block template takes over the search page; the blocks fetch results client-side via the Interactivity API.
- **Blocks Overlay (`overlay_blocks`, experimental)** — same client-side fetch, but painted as a full-screen modal over the theme's search page; gated behind `is_block_template_overlay_enabled()`.

For the two blocks-driven experiences, `Search_Blocks::owns_search_results()` is the single predicate that says "the blocks render the results, so the server must do no search." It drives two suppressions that together remove all server-side search work: `Initializer::init_search_blocks()` stops Classic/Instant Search from initializing (no ES query, no hydration `WP_Query`), and `Search_Blocks::filter__posts_pre_query()` short-circuits the remaining core database query. Both are front-end only (`! is_admin()`). Note these are independent of how results are *fetched* — there is no opt-out filter to "fall back" to a server query, because the blocks never read `WP_Query` results anyway.

## Hydration & SSR seeding

The Interactivity API store has to be seeded *before* any block markup renders, or `data-wp-bind` / `data-wp-text` resolve against an empty store and the first paint shows stale values.

- `Search_Blocks::seed_interactivity_state()` is hooked on **both** `template_redirect` and `wp_enqueue_scripts`. FSE block-template rendering runs *before* `wp_head()` (see `wp-includes/template-canvas.php`), so the classic `wp_enqueue_scripts` seed lands too late on block themes; `template_redirect` covers them, and the later `wp_enqueue_scripts` call is a deep-merge no-op that keeps classic-theme paths covered.
- Per-block `render.php` files contribute **their own** config (`filterConfigs[<key>]`, layout, post-type scope) on top of the global seed — the seed provides the base (`apiRoot`, `nonce`, URL-derived `searchQuery` / `activeFilters`).
- The block-template overlay HTML is rendered during `wp_enqueue_scripts` (cached in `$block_template_overlay_rendered_html`) so the embedded blocks' view-module enqueues land *before* `wp_print_import_map()` runs at footer priority 1 — that walk is what puts `jetpack-search/store` into the importmap.

## Naming

All blocks use the `jetpack-search/*` namespace (mirrors the composer package `automattic/jetpack-search`).

Current slug shapes — match one if it fits, but new shapes are fine when nothing here covers it:

- **Filters:** `filter-{kind}` (e.g. `filter-checkbox`, `filter-date`). Visitor-facing titles read "Filter by X". Author-configured scoping (e.g. the `search-input` block's "Post types" inspector panel) lives on the input that fires the search rather than as a standalone filter block.
- **Filter compositions:** `filters` for the default vertical stack; layout-suffixed `filters-{layout}` for variants (e.g. `filters-popover`, `filters-product`).
- **Results region:** `search-results` for the container; `results-{role}` for atoms inside it (`results-list`, `results-count`, `results-sort`, `results-load-more`).
- **Standalone:** bare role slug (`search-input`, `powered-by`, `active-filters`).

Titles aim to read naturally in the inserter, not mirror the slug shape — "Sort By" not "Results Sort", "Collapsible Filters" not "Filters Popover".

## Shared store / bundles

`store/` is a single shared module, not per-block code. A block `view.js` that
needs store actions/state imports the bare specifier:

```js
import 'jetpack-search/store';
```

**Never** `import '../../store'` (relative) — that inlines the whole ~1,250-line
store into the block's view bundle, and with ~14 interactive blocks that's the
store shipped ~14 times. The blocks build (`tools/webpack.blocks.config.js`)
externalizes `jetpack-search/store` via `DependencyExtractionPlugin`'s
`requestToExternalModule`, so the bare specifier compiles to a dependency on the
`jetpack-search/store` WordPress Script Module (registered in
`Search_Blocks::register_store_script_module()`), shipped once and cached.

The same specifier is mapped back to `store/index.js` for Jest
(`jest*.config.js` `moduleNameMapper`) and for `import/no-unresolved`
(`eslint.config.mjs` `import/core-modules`). A pure store importer compiles to
~1 KB; `.size-limit.js` guards `results-list.js` so a regression that re-inlines
the store trips CI.

## CSS classes

WordPress derives `.wp-block-jetpack-search-{bare-slug}` from the full block name. For blocks whose bare slug already starts with `search-` the segment repeats (`.wp-block-jetpack-search-search-input`); that's harmless and only used internally.

Manual wrapper classes (set via `useBlockProps({ className })` and the matching `get_block_wrapper_attributes()` call in `render.php`) don't have to track the slug exactly — they're just CSS hooks.

## URL format

Filters round-trip through the URL in Jetpack Search's array shape: `?<filterKey>[]=<value>`, one param per selected value. Both sides agree on this contract — `store/url-state.js` writes/reads it on the JS side, `Search_Blocks::parse_url_filters()` reads it on the PHP side.

Don't add a comma-joined / WC-style scalar shape (`?filter_stock_status=in,out`) for new product filters either. Stick to `?filter_stock_status[]=in&filter_stock_status[]=out` so deep links stay interchangeable with instant-search and the PHP parser doesn't need a per-filter URL-format opt-in.

Price is the one exception, and only because its shape doesn't fit. `activeFilters` is typed `{ [filterKey]: string[] }` — discrete, OR-able selections that build a `terms` ES clause. `priceRange` is `{ min, max }`, builds a `range` clause, and writes scalar `min_price` / `max_price` URL params. It lives as a sibling on store state rather than getting shoehorned into `activeFilters` with a sentinel encoding.

Static post-type scope (the `search-input` block's "Post types" inspector setting) round-trips as scalar `?post_type=<slug>` for the single-slug include-mode case only — pairs with WP/WC's own `?post_type=` URL convention. Multi-slug and exclude-mode scopes stay session-local (the input still constrains its dispatches, but those scopes don't get serialized into the URL). `post_type` is reserved on both sides (`store/url-state.js` `RESERVED_PARAMS` + `Search_Blocks::RESERVED_QUERY_PARAMS`) so it can't double-book as a filter or static-filter scalar.

## Filter bucket lifecycle

Filter rows on the front-end come from three sources merged in this order (see `store/index.js` `buildFilterItems()`):

1. The current ES aggregation's buckets — authoritative for label and count.
2. `retainedFilterOptions[filterKey]` — values seen in earlier responses whose buckets dropped out of the latest result set; rendered with `count = 0` so a checked filter never disappears from under the visitor.
3. URL-seeded selections that didn't show up in either of the above.

Sort rule (`sortItems()`): **unchecked, zero-count items sink to the bottom**; the rest follow `bucketSortOrder` (count desc or alpha). Checked items keep their configured order regardless of count, so toggling a filter doesn't reflow the list. Tie-breaker is the visible label so two equal-count buckets don't swap across re-renders — ES bucket order is unstable on ties. `maxItems` is applied *after* sorting, so retained-but-now-empty entries drop first.

## WooCommerce gating

WC-only features hang off three canonical gates — **don't add a fourth** by re-implementing the probe in a render path or block edit:

- **PHP:** `Search_Blocks::woocommerce_blocks_enabled()` — single memoized probe that requires both `class_exists( 'WooCommerce', false )` **and** `woocommerce_version_supported()` (WooCommerce >= `MIN_WOOCOMMERCE_VERSION`, currently `6.5.0` — the release that registers the `product-search-results` template the WC-only features front). Must be called at or after `plugins_loaded`. Use from any registration / render / parse path that should disappear on non-Woo sites. The probed value passes through the `jetpack_search_woocommerce_blocks_enabled` filter once before being cached, so a site can force the gate either way regardless of WC's plugin state or version (e.g. hide WC-only blocks on a non-shop content area of a Woo site, or render them in a non-Woo staging preview).
- **Interactivity store seed:** `state.isWooCommerceBlocksEnabled` — read from JS store callbacks (e.g. URL-state parsing, sort-order validation) instead of probing for `window.WooCommerce` directly.
- **Editor:** `window.JetpackSearchBlocksConfig.isWooCommerceBlocksEnabled` — localized in `Search_Blocks::enqueue_editor_assets()`. Read from block edit components to hide WC-only options from the inspector.

Tests flip the gate via `Search_Blocks::set_woocommerce_blocks_enabled_for_testing( true|false|null )` (PHP) or `globalThis.JetpackSearchBlocksConfig = { isWooCommerceBlocksEnabled: true }` (JS). Add a WC-on / WC-off matrix test for every new gate.

Single source of truth for which blocks count as WC-only:

- **`Search_Blocks::woocommerce_only_block_names()`** — explicit list of full namespaced block names (e.g. `jetpack-search/filter-wc-rating`, `jetpack-search/filters-product`). Adding one entry there auto-applies the gate at every call site:
  - `register_blocks()` skips the matching directory's `register_block_type()` on non-Woo sites.
  - `filter_block_helpers()` drops the entry from the helper map so the filter-config walk stays symmetric with what's registered.
  - The list is localized onto `window.JetpackSearchBlocksConfig.woocommerceOnlyBlocks` so the editor's `register-blocks.js` skips the matching `registerBlockType()` call too.
- **`Search_Blocks::is_woocommerce_only_block( $block_name )`** — exact-match lookup against the list above. Accepts either a full namespaced block name or a bare directory basename (the registration loop walks dir basenames; the helpers map and editor bundle hold full names).

Other WC-only surfaces have to opt into the gate explicitly because they aren't standalone blocks:

- **WC-only patterns:** filename in `patterns/` starts with `wc-`. Caught in `register_patterns()`.
- **WC-only block variations** (e.g. `product_cat`, `product_tag` on `filter-checkbox`): wrap their `$additions[] = …` push in an `if ( self::woocommerce_blocks_enabled() )` block in `inject_filter_checkbox_variations()`.
- **WC-only render paths on shared blocks** (e.g. the `product` layout on `results-list`): collapse to a neutral default in `render.php` and prune the option from the editor inspector. Don't leave a reachable code path that reads WC-shaped fields on a non-Woo site.

A saved post that contains a WC-only block on a site that later deactivates WooCommerce will render the missing-block placeholder for that block — that's expected (and matches WordPress's behavior for any deactivated-plugin block). Authors remove the placeholder and re-pick a non-WC alternative.

## Interactivity API gotchas

- **Synchronous event access.** Any store action that reads `event.currentTarget`, calls `event.preventDefault()`, etc. must be wrapped in `withSyncEvent` — the Interactivity API will turn the "synchronous event access" warning into a hard error in WordPress 7.0. `store/index.js` exports a polyfill that falls back to a noop wrapper on pre-WP 6.7 so the package still loads.
- **Module-scope state lives for the page lifetime.** Variables declared at module top in `store/*.js` (`seededDateFormat`, the AI-answer mount latch, suggestion fetch coalescers) persist for the page; never store per-instance state there.
- **Seeded vs client-only state.** Anything the SSR markup binds (`searchQuery`, `activeFilters`, `filterConfigs`, plan flags) must come through `seed_interactivity_state()` so the server-rendered HTML and the hydrated store agree on the first paint. Pure UI state (open/closed flags, hover index) lives client-side only.
- **`getContext()` is only live inside the originating handler.** Reading it from a deferred callback (`setTimeout`, microtask, generator yield resume) returns `null` — context tracking ends with the synchronous handler that started the dispatch. Capture the proxy synchronously in the entry handler and pass it into the deferred call (see `scheduleSearch` / `scheduleSuggestions` in `search-input/`).
- **`hasOwn` + null prototype for filter-key gates.** `gateActiveFilters()` uses `Object.hasOwn` and `Object.create( null )` so `__proto__` / `constructor` / `toString` URL keys can't smuggle through prototype-chain hits.

## Editor ↔ render parity

Block edit components mirror the server `render.php` so the canvas preview matches what visitors see. A few patterns recur:

- **Normalize, don't trust raw attributes.** `results-sort` `resolveAvailable()` mirrors `Results_Sort::resolve_available_options()`: unknown keys drop, canonical order wins, empty falls back to the full set. The PHP and JS implementations must move together — a divergence between them is a parity bug.
- **`previewSelected` fallback.** When a saved `defaultSort` no longer appears in `availableSortOptions` (author just unchecked it), fall back to the first visible option for the preview. The render callback already does this; the edit component has to do it too.
- **Snap empty selections to the full set.** Persisting `availableSortOptions: []` would make the renderer fall back to "all options" while every inspector checkbox stays unchecked — invisible mismatch. The setter writes the canonical full set back instead.
- **Per-instance IDs.** Edit components that emit `<label htmlFor=…>` use `useId()` — the editor canvas may render the same block twice, and a shared static id breaks the label→control association on the second instance.
