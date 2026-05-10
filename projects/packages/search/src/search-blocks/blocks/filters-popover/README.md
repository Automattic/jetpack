# Collapsible Filters — `jetpack-search/filters-popover`

> Compact filter trigger that opens a popover containing filter checkboxes.

<!-- screenshot placeholder -->

The Collapsible Filters block renders a compact icon button that opens a popover dialog containing filter blocks. It is the alternative to the sidebar `jetpack-search/filters` layout when screen real estate is limited. Popover open/close state is owned by the shared `jetpack-search` Interactivity API store (`state.isFilterPopoverOpen`). An active-filter badge on the trigger button shows the count of currently selected filters.

The block is a **container (InnerBlocks)** block, server-rendered (`render.php`), and hydrated by `view.js`.

---

## Attributes

This block exposes no custom attributes.

---

## Default template

When first inserted the block is pre-populated with:

```
jetpack-search/active-filters
jetpack-search/clear-filters
jetpack-search/filter-checkbox  (taxonomy=category)
jetpack-search/filter-checkbox  (taxonomy=post_tag)
jetpack-search/filter-checkbox  (filterType=post_type)
```

---

## Allowed inner blocks

- `jetpack-search/filter-checkbox`
- `jetpack-search/active-filters`
- `jetpack-search/clear-filters`
- `jetpack-search/filter-post-type`

---

## Block relationships

No required parent block. Typically placed near the `jetpack-search/search-input` block in a compact search layout.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/filters-popover -->
<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"category"} /-->
<!-- /wp:jetpack-search/filters-popover -->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer emits a trigger button and a popover `<div role="dialog">`. The trigger button carries `data-wp-bind--aria-expanded` and `data-wp-on--click` directives; the window receives `data-wp-on-window--click` and `data-wp-on-window--keydown` listeners to close the popover on outside click or Escape key.
- A `<span class="jetpack-search-filters-popover__badge">` showing the active filter count is revealed only when `state.activeFilterCount` is non-zero.
- The `save` function returns `<InnerBlocks.Content />` (not `null`) so inner block delimiters survive serialisation.
- Each inner block still runs its own Interactivity API logic; the popover wrapper is a layout shell only.
