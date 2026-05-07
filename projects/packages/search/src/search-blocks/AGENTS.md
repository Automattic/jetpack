# Search Blocks — naming convention

This file documents the naming convention for blocks under `src/search-blocks/`. When adding a new block, pick the family that fits its role and follow the corresponding pattern. **Mechanical slugs, natural titles** — slugs are predictable for developers; titles read naturally for end users.

## Namespace

All Search blocks use the `jetpack-search/*` namespace, not the shared `jetpack/*` namespace. The namespace mirrors the composer package name (`automattic/jetpack-search`) and keeps Search slugs out of the shared Jetpack pool — generic verbs like `load-more` or `results-list` don't reserve those terms across the rest of the Jetpack surface.

## Families

| Family | Slug pattern | Title style | Examples |
|---|---|---|---|
| Atomic filters | `jetpack-search/filter-{kind}` (singular) | Visitor-facing: "Filter by X" (verb form). Author-configured (no front-end UI): a distinct noun that signals author-only role (e.g. "Post Type Scope") so it doesn't collide with a visitor-facing variation of the same dimension. | `filter-checkbox`, `filter-date` ("Filter by Date"), `filter-post-type` ("Post Type Scope") |
| Filter compositions | `jetpack-search/filters-{layout}` (plural) | "Filters X" / descriptive | `filters-stack` ("Filters Stack"), `filters-popover` ("Collapsible Filters") |
| Search results (composition) | `jetpack-search/search-results` | "Search Results" | the container for the results region |
| Results atoms | `jetpack-search/results-{role}` | "X" or "Results X" | `results-list`, `results-count`, `results-sort` ("Sort By"), `results-load-more` ("Load More") |
| Standalone | `jetpack-search/{role}` | role-named | `search-input`, `powered-by`, `active-filters` |

The singular/plural split for filters mirrors Gutenberg's atom/container precedent (`core/list` + `core/list-item`, `core/social-link` + `core/social-links`). The results family uses one prefix for every block in the region; the container uses the distinct word `search-results` so it is mechanically distinguishable from its `results-{role}` children.

## Decision tree — adding a new block

1. **Does it filter the query?** Use `filter-{kind}`. Title: "Filter by X". Visitor-controlled (renders UI) or author-configured (no front-end UI) both qualify.
2. **Does it group multiple filter blocks together?** Use `filters-{layout}` (plural). Title: descriptive of the layout role.
3. **Does it live inside the results region (count, sort, list, pagination, attribution)?** Use `results-{role}`. Title: short and natural.
4. **Is it the container for the results region?** Use `search-results` (only one of these — there is no second).
5. **Else** (a standalone, non-region block): use a bare role slug. Title: role-named.

## CSS class names

WordPress derives the front-end CSS class from the full block name: `.wp-block-{namespace}-{bare-slug}` with `/` replaced by `-`. So `jetpack-search/filter-date` → `.wp-block-jetpack-search-filter-date`. Note that for blocks whose bare slug starts with `search-` (currently only `search-input` and `search-results`), the derived class repeats the `search-` segment (`.wp-block-jetpack-search-search-input`). This is internal-only and not avoidable without diverging the bare slug from its semantics.

## Manual / BEM class names

The block's auto-derived class is fine for most styling. For internal layout/UI vocabulary (e.g. `__trigger`, `__panel`, `__icon`), use BEM-style names rooted at a block-descriptive identifier (`jetpack-search-filter-popover__trigger`). The BEM root does not need to track the slug exactly — it's a CSS identifier, not block identity.

## Examples

| User intent | New slug | Title |
|---|---|---|
| Filter by price range | `jetpack-search/filter-price` | "Filter by Price" |
| Filter by rating | `jetpack-search/filter-rating` | "Filter by Rating" |
| Filters arranged in tabs | `jetpack-search/filters-tabs` | "Tabbed Filters" |
| Spelling-suggestion display in the results region | `jetpack-search/results-suggestion` | "Spelling Suggestion" |
| Standalone "Recent searches" widget | `jetpack-search/recent-searches` | "Recent Searches" |
