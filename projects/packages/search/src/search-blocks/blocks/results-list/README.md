# Results List — `jetpack-search/results-list`

> Renders Jetpack Search results, plus the empty-state and error messages for the same region.

<!-- screenshot placeholder -->

The Results List block renders three sibling regions inside a single block wrapper:

1. **Results list** — a skeleton placeholder on first paint, replaced by live search results after hydration.
2. **Empty-state message** — shown when a query returns no results (`state.showNoResults`).
3. **Error message** — shown when the search request fails (`state.showError`).

The active region is controlled by Interactivity API store flags so exactly one message is visible at a time. The block supports three result layouts: `compact`, `expanded` (default), and `product`.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `string` (`"compact"` \| `"expanded"` \| `"product"`) | `"expanded"` | Controls the visual density and which metadata fields are rendered per result. `compact` — title + date; `expanded` — image + title + excerpt + path + date; `product` — image + title + price + star rating. |
| `noResultsMessage` | `string` | `""` | Message displayed when the search returns zero results. Defaults to a translated string when empty. |
| `errorMessage` | `string` | `""` | Message displayed when the search request fails. Defaults to a translated string when empty. |

---

## Block relationships

Intended child of `jetpack-search/search-results`. Has no InnerBlocks of its own.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/results-list /-->
```

With all attributes:

```html
<!-- wp:jetpack-search/results-list {"layout":"compact","noResultsMessage":"Nothing found.","errorMessage":"Something went wrong."} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer resolves layout-specific feature flags (whether to show image, path, excerpt, date, price, rating) using an internal `$resolve_layout` closure.
- Each result item is wrapped in Interactivity API directives (`data-wp-each`, `data-wp-bind`, etc.) that are hydrated from `state.results` in the `jetpack-search` store.
- The skeleton placeholder (`data-wp-bind--hidden="!state.isLoading"`) is always present in the DOM but hidden outside the initial load so cumulative layout shift is minimised.
