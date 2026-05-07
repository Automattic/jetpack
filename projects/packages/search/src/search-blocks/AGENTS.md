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
