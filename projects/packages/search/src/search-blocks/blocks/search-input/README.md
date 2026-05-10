# Search Input — `jetpack-search/search-input`

> Text input that drives Jetpack Search results.

<!-- screenshot placeholder -->

The Search Input block renders a query text field that is wired to the shared Jetpack Search [Interactivity API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-interactivity/) store. Typing in the field issues a new search request and updates all other blocks (`results-list`, `results-count`, `results-sort`, etc.) on the page without a full reload.

The block is server-rendered (`render.php`) and hydrated on the front end by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | `string` | `""` | Input placeholder text. When empty the translated string `"Search…"` is used at render time. |
| `showIcon` | `boolean` | `true` | Whether to display the magnifying-glass icon inside the input. |
| `submitOnly` | `boolean` | `false` | When `true` the block hides the live-search spinner and only triggers a search on explicit form submission (Enter key or submit button). Useful when the page layout is not optimised for search-as-you-type. |

---

## Block relationships

This block has no required parent or children. It is typically placed alongside the `jetpack-search/filters` or `jetpack-search/filters-popover` block in a sidebar or header region, and above the `jetpack-search/search-results` container.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/search-input /-->
```

With all attributes:

```html
<!-- wp:jetpack-search/search-input {"placeholder":"Find something…","showIcon":false,"submitOnly":true} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The initial `value=` attribute of the `<input>` is seeded from the URL (`?s=` or `?q=`) by `Search_Blocks::parse_url_search_query()` so deep-linked searches display the correct query on first paint before JavaScript hydrates.
- Uses `wp_unique_id()` to associate the `<label>` with the `<input>` via matching `for`/`id` pairs.
- The Interactivity API namespace is `jetpack-search`; the relevant store action is `actions.onSearchInput`.
