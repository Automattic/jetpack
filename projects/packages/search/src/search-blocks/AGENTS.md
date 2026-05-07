# Search Blocks

Notes for contributors (and AI agents) working in `src/search-blocks/`.

## Naming

All blocks use the `jetpack-search/*` namespace (mirrors the composer package `automattic/jetpack-search`).

Current slug shapes — match one if it fits, but new shapes are fine when nothing here covers it:

- **Filters:** `filter-{kind}` (e.g. `filter-checkbox`, `filter-date`, `filter-post-type`). Visitor-facing titles read "Filter by X". Author-configured filters with no front-end UI take a distinct title (e.g. "Post Type Scope") so they don't collide with visitor-facing variations of the same dimension.
- **Filter compositions:** `filters-{layout}` (e.g. `filters-stack`, `filters-popover`).
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
