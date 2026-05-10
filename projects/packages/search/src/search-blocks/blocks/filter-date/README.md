# Filter by Date — `jetpack-search/filter-date`

> Group Jetpack Search results into yearly or monthly time buckets.

<!-- screenshot placeholder -->

The Filter by Date block renders a list of date-range checkboxes that let visitors scope a search to a single year or month. Buckets are aggregated by Jetpack Search and sorted by the configured order. Each bucket label shows the year or year–month and optionally the result count.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `interval` | `string` (`"year"` \| `"month"`) | `"year"` | Granularity of date buckets: yearly or monthly. |
| `label` | `string` | `""` | Heading displayed above the date list. Defaults to a translated string (e.g. "Date") when empty. |
| `showCount` | `boolean` | `true` | Whether to display result counts beside each date option. |
| `maxItems` | `integer` | `10` | Maximum number of date buckets to display (1–50). |
| `bucketSortOrder` | `string` (`"newest"` \| `"oldest"` \| `"count"`) | `"newest"` | How to order the date buckets: most recent first, oldest first, or by result count descending. |

---

## Block relationships

Intended child of `jetpack-search/filters`. Has no InnerBlocks of its own. Multiple instances may coexist (e.g. one for yearly, one for monthly buckets).

---

## Minimum example markup

```html
<!-- wp:jetpack-search/filter-date /-->
```

Monthly buckets, limited to 6, ordered by count:

```html
<!-- wp:jetpack-search/filter-date {"interval":"month","maxItems":6,"bucketSortOrder":"count"} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer derives a unique `filterKey` from `(interval)` via `Filter_Date::derive_filter_key()` and registers the filter's configuration into the shared `jetpack-search` Interactivity state via `wp_interactivity_state()`.
- Requires `wp_interactivity_state()` (available since WP 6.5); renders nothing on older cores.
- Deep-linked date selections are pre-checked server-side via `Search_Blocks::pre_hydration_filter_view()`.
