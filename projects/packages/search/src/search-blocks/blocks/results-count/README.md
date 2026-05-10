# Results Count — `jetpack-search/results-count`

> Displays the Jetpack Search results count.

<!-- screenshot placeholder -->

The Results Count block renders a `<p>` element whose text content is bound to the `state.resultsCountText` property in the shared `jetpack-search` Interactivity API store. On first paint the element displays a localised "Searching…" string (seeded server-side when a URL-triggered initial fetch is expected); after hydration the store replaces it with the live count (e.g., "1,234 results for 'wordpress'").

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

This block exposes no custom attributes.

---

## Block relationships

Intended child of `jetpack-search/search-results`. Typically placed beside `jetpack-search/results-sort` in a `core/group` (flex, space-between) so the two controls sit at opposite ends of a row.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/results-count /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer emits an empty `<p>` with a `data-wp-text="state.resultsCountText"` directive; the actual count text is injected by the Interactivity API on hydration.
- The element is always rendered (even before a query produces results) so that a flex layout placing `results-count` and `results-sort` at the two ends of a row does not collapse when count text is absent.
- When the URL carries a search query, `Search_Blocks::build_initial_state()` seeds `state.resultsCountText` with a localised "Searching…" string via `wp_interactivity_state()`, preventing a blank flash before JS hydrates.
