# Filters — `jetpack-search/filters`

> Vertical stack of Jetpack Search filter blocks.

<!-- screenshot placeholder -->

The Filters block (internally `jetpack-search/filters`) is a **container (InnerBlocks)** block that arranges filter blocks in a vertical stack — the canonical sidebar-style layout. It is pre-populated with the most common filters; authors can rearrange, remove, or add more from the inserter. The container itself contributes only a styled wrapper `<div>`; each inner filter block handles its own markup and Interactivity API wiring.

The block is server-rendered (`render.php`) and serialises inner blocks via `save: () => <InnerBlocks.Content />`.

> **Note:** In the issue description and some documentation this block is referred to as `filters-stack`. The actual block name is `jetpack-search/filters` and its directory is `src/search-blocks/blocks/filters/`.

---

## Attributes

This block exposes no custom attributes. Styling is controlled through the standard block-supports UI (color, spacing, border, typography).

---

## Default template

When first inserted the block is pre-populated with:

```
jetpack-search/active-filters
jetpack-search/clear-filters
jetpack-search/filter-checkbox  (taxonomy=category)
jetpack-search/filter-checkbox  (taxonomy=post_tag)
jetpack-search/filter-checkbox  (filterType=author)
jetpack-search/filter-checkbox  (filterType=post_type)
jetpack-search/filter-date      (interval=year)
jetpack-search/filter-post-type
```

---

## Allowed inner blocks

- `jetpack-search/active-filters`
- `jetpack-search/clear-filters`
- `jetpack-search/filter-checkbox`
- `jetpack-search/filter-date`
- `jetpack-search/filter-post-type`

---

## Block relationships

No required parent block. Usually placed in a sidebar column or above/below the `jetpack-search/search-results` container.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/filters -->
<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"category"} /-->
<!-- /wp:jetpack-search/filters -->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer receives `$content` (serialised inner block HTML) and wraps it in a `<div class="jetpack-search-filters">` with `get_block_wrapper_attributes()`.
- The `save` function returns `<InnerBlocks.Content />` (not `null`) so inner block delimiters survive serialisation.
