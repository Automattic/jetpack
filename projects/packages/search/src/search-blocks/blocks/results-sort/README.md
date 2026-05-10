# Sort By — `jetpack-search/results-sort`

> Controls the order of Jetpack Search results.

<!-- screenshot placeholder -->

The Sort By block lets visitors change the sort order of search results. Three display styles are available: a `<select>` dropdown (default), inline radio buttons, or a compact popover trigger. The available sort options and the pre-selected default are both configurable per-block in the editor inspector.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `defaultSort` | `string` | `"relevance"` | The sort order active when a visitor first lands (no URL `?orderby=` parameter). Valid values: `relevance`, `newest`, `oldest`, `rating_desc`, `price_asc`, `price_desc`. |
| `availableSortOptions` | `string[]` | `["relevance","newest","oldest"]` | The list of sort options presented to the visitor. At least one option must remain. |
| `label` | `string` | `""` | Screen-reader / visible label preceding the control. Defaults to a translated "Sort by" string when empty. |
| `displayAs` | `string` | `"select"` | Visual style of the control: `select` (dropdown), `radio` (inline radio group), or `popover` (compact trigger). |
| `display` | `string` | — | Legacy alias for `displayAs`. Accepted values: `select`, `popover`. Normalised to `displayAs` by `Results_Sort::normalize_display_as()`. |

### Valid sort values

| Value | Meaning |
|-------|---------|
| `relevance` | Best match (Elasticsearch score) |
| `newest` | Most recently published |
| `oldest` | Earliest published |
| `rating_desc` | Highest WooCommerce rating first |
| `price_asc` | Lowest WooCommerce price first |
| `price_desc` | Highest WooCommerce price first |

---

## Block relationships

Intended child of `jetpack-search/search-results`. Typically placed beside `jetpack-search/results-count` in a `core/group` (flex, space-between) row.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/results-sort /-->
```

With custom options:

```html
<!-- wp:jetpack-search/results-sort {"defaultSort":"newest","availableSortOptions":["relevance","newest"],"displayAs":"radio"} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer resolves available options, the effective sort for first paint (URL `?orderby=` wins over `defaultSort`), and the display style via helper methods on the `Results_Sort` class.
- The URL sort takes precedence over `defaultSort` so that deep links preserve their meaning — the same precedence used by the instant-search overlay.
- The `display` attribute (legacy) is normalised to `displayAs` by `Results_Sort::normalize_display_as()` before rendering.
- Uses `wp_interactivity_data_wp_context()` (available since WP 6.5) for the radio/popover templates; falls back gracefully on older cores.
