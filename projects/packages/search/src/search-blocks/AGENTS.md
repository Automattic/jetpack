# Search Blocks

Notes for contributors (and AI agents) working in `src/search-blocks/`.

## Naming

All blocks use the `jetpack-search/*` namespace (mirrors the composer package `automattic/jetpack-search`).

Current slug shapes — match one if it fits, but new shapes are fine when nothing here covers it:

- **Filters:** `filter-{kind}` (e.g. `filter-checkbox`, `filter-date`, `filter-post-type`). Visitor-facing titles read "Filter by X". Author-configured filters with no front-end UI take a distinct title (e.g. "Post Type Scope") so they don't collide with visitor-facing variations of the same dimension.
- **Filter compositions:** `filters` for the default vertical stack; layout-suffixed `filters-{layout}` for variants (e.g. `filters-popover`, `filters-product`).
- **Results region:** `search-results` for the container; `results-{role}` for atoms inside it (`results-list`, `results-count`, `results-sort`, `results-load-more`).
- **Standalone:** bare role slug (`search-input`, `powered-by`, `active-filters`).

Titles aim to read naturally in the inserter, not mirror the slug shape — "Sort By" not "Results Sort", "Collapsible Filters" not "Filters Popover".

## CSS classes

WordPress derives `.wp-block-jetpack-search-{bare-slug}` from the full block name. For blocks whose bare slug already starts with `search-` the segment repeats (`.wp-block-jetpack-search-search-input`); that's harmless and only used internally.

Manual wrapper classes (set via `useBlockProps({ className })` and the matching `get_block_wrapper_attributes()` call in `render.php`) don't have to track the slug exactly — they're just CSS hooks.

## URL format

Filters round-trip through the URL in Jetpack Search's array shape: `?<filterKey>[]=<value>`, one param per selected value. Both sides agree on this contract — `store/url-state.js` writes/reads it on the JS side, `Search_Blocks::parse_url_filters()` reads it on the PHP side.

Don't add a comma-joined / WC-style scalar shape (`?filter_stock_status=in,out`) for new product filters either. Stick to `?filter_stock_status[]=in&filter_stock_status[]=out` so deep links stay interchangeable with instant-search and the PHP parser doesn't need a per-filter URL-format opt-in.

Price is the one exception, and only because its shape doesn't fit. `activeFilters` is typed `{ [filterKey]: string[] }` — discrete, OR-able selections that build a `terms` ES clause. `priceRange` is `{ min, max }`, builds a `range` clause, and writes scalar `min_price` / `max_price` URL params. It lives as a sibling on store state rather than getting shoehorned into `activeFilters` with a sentinel encoding.

## WooCommerce gating

WC-only features hang off three canonical gates — **don't add a fourth** by re-implementing the probe in a render path or block edit:

- **PHP:** `Search_Blocks::is_woocommerce_active()` — single memoized `class_exists( 'WooCommerce', false )` probe. Must be called at or after `plugins_loaded`. Use from any registration / render / parse path that should disappear on non-Woo sites. The probed value passes through the `jetpack_search_blocks_is_woocommerce_active` filter once before being cached, so a site can force the gate either way (e.g. hide WC-only blocks on a non-shop content area of a Woo site, or render them in a non-Woo staging preview).
- **Interactivity store seed:** `state.isWooCommerceActive` — read from JS store callbacks (e.g. URL-state parsing, sort-order validation) instead of probing for `window.WooCommerce` directly.
- **Editor:** `window.JetpackSearchBlocksConfig.isWooCommerceActive` — localized in `Search_Blocks::enqueue_editor_assets()`. Read from block edit components to hide WC-only options from the inspector.

Tests flip the gate via `Search_Blocks::set_is_woocommerce_active_for_testing( true|false|null )` (PHP) or `globalThis.JetpackSearchBlocksConfig = { isWooCommerceActive: true }` (JS). Add a WC-on / WC-off matrix test for every new gate.

Single source of truth for which blocks count as WC-only:

- **`Search_Blocks::woocommerce_only_block_names()`** — explicit list of full namespaced block names (e.g. `jetpack-search/filter-wc-rating`, `jetpack-search/filters-product`). Adding one entry there auto-applies the gate at every call site:
  - `register_blocks()` skips the matching directory's `register_block_type()` on non-Woo sites.
  - `filter_block_helpers()` drops the entry from the helper map so the filter-config walk stays symmetric with what's registered.
  - The list is localized onto `window.JetpackSearchBlocksConfig.woocommerceOnlyBlocks` so the editor's `register-blocks.js` skips the matching `registerBlockType()` call too.
- **`Search_Blocks::is_woocommerce_only_block( $block_name )`** — exact-match lookup against the list above. Accepts either a full namespaced block name or a bare directory basename (the registration loop walks dir basenames; the helpers map and editor bundle hold full names).

Other WC-only surfaces have to opt into the gate explicitly because they aren't standalone blocks:

- **WC-only patterns:** filename in `patterns/` starts with `wc-`. Caught in `register_patterns()`.
- **WC-only block variations** (e.g. `product_cat`, `product_tag` on `filter-checkbox`): wrap their `$additions[] = …` push in an `if ( self::is_woocommerce_active() )` block in `inject_filter_checkbox_variations()`.
- **WC-only render paths on shared blocks** (e.g. the `product` layout on `results-list`): collapse to a neutral default in `render.php` and prune the option from the editor inspector. Don't leave a reachable code path that reads WC-shaped fields on a non-Woo site.

A saved post that contains a WC-only block on a site that later deactivates WooCommerce will render the missing-block placeholder for that block — that's expected (and matches WordPress's behavior for any deactivated-plugin block). Authors remove the placeholder and re-pick a non-WC alternative.
