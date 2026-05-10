# Checkbox Filter — `jetpack-search/filter-checkbox`

> Checkbox filter for Jetpack Search — group results by taxonomy, post type, or author.

<!-- screenshot placeholder -->

The Checkbox Filter block renders a titled list of checkbox options that let visitors narrow search results by a chosen dimension (taxonomy term, post type, or author). Eight **variations** are registered in the inserter, each pre-seeded for a specific filter type, so authors reach for "Filter by Category" rather than configuring the generic block manually. The variation can be changed later in the block inspector without deleting and re-inserting the block.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `filterType` | `string` (`"taxonomy"` \| `"post_type"` \| `"author"`) | `"taxonomy"` | The primary dimension this filter operates on. |
| `taxonomy` | `string` | `"category"` | When `filterType` is `"taxonomy"`, the slug of the taxonomy to filter by (e.g. `"category"`, `"post_tag"`, or any custom taxonomy slug). Ignored when `filterType` is `"post_type"` or `"author"`. |
| `label` | `string` | `""` | Heading displayed above the checkbox list. Defaults to the variation-specific label (see table below) when empty. |
| `showCount` | `boolean` | `true` | Whether to display result counts beside each option. |
| `maxItems` | `integer` | `10` | Maximum number of options to display (1–50). |
| `bucketSortOrder` | `string` (`"count"` \| `"alpha"`) | `"count"` | How to order the options: by result count descending (`"count"`) or alphabetically (`"alpha"`). |

---

## Variations

| Variation name | `filterType` | `taxonomy` | Default label |
|----------------|-------------|-----------|---------------|
| `category` | `taxonomy` | `category` | "Category" |
| `post_tag` | `taxonomy` | `post_tag` | "Tag" |
| `post_type` | `post_type` | — | "Post Type" |
| `author` | `author` | — | "Author" |
| `product_cat` | `taxonomy` | `product_cat` | "Product Category" |
| `product_tag` | `taxonomy` | `product_tag` | "Product Tag" |
| `product_brand` | `taxonomy` | `product_brand` | "Product Brand" |
| `custom_taxonomy` | `taxonomy` | `""` | *(label required)* |

> Variations are registered server-side in `Search_Blocks::inject_filter_checkbox_variations()`.

---

## Block relationships

Intended child of `jetpack-search/filters` or `jetpack-search/filters-popover`. Has no InnerBlocks of its own. Multiple instances of this block may coexist in the same parent with different configurations.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/filter-checkbox /-->
```

Category variation:

```html
<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"category"} /-->
```

Author variation with custom label, counts hidden, alphabetical sort, max 5 items:

```html
<!-- wp:jetpack-search/filter-checkbox {"filterType":"author","label":"By author","showCount":false,"maxItems":5,"bucketSortOrder":"alpha"} /-->
```

Custom taxonomy:

```html
<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"genre","label":"Genre"} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer derives a unique `filterKey` from `(filterType, taxonomy)` via `Filter_Checkbox::derive_filter_key()`, registers the filter's configuration into the shared `jetpack-search` Interactivity state via `wp_interactivity_state()`, then emits the checkbox list DOM.
- The block renders nothing (early return) when the `filterKey` is empty (e.g. a custom taxonomy with no slug set) or when `wp_interactivity_state()` is unavailable (WP < 6.5).
- Deep-linked filter selections (from the URL) are pre-checked server-side via `Search_Blocks::pre_hydration_filter_view()` so the page is meaningful before JavaScript hydrates.
- The `Custom taxonomy` variation surfaces a `<SelectControl>` in the editor inspector populated from registered non-built-in taxonomies via the `core` data store. Built-in taxonomies (`category`, `post_tag`, `product_cat`, `product_tag`, `product_brand`) are excluded from this picker since they have dedicated variations.
