# Active Filters — `jetpack-search/active-filters`

> Pills showing the currently selected Jetpack Search filters.

<!-- screenshot placeholder -->

The Active Filters block renders a row of dismissible pill elements, one per selected filter value. Each pill shows the filter name and value; clicking it removes that filter from the active selection. The wrapper is hidden on first paint when no filter is active, avoiding layout shift before JavaScript hydrates.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

This block exposes no custom attributes.

---

## Block relationships

Commonly placed as the first child of `jetpack-search/filters` or `jetpack-search/filters-popover`, above the individual filter blocks. Has no InnerBlocks of its own.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/active-filters /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer reads the seeded Interactivity API state (`state.activeFilters`, `state.priceRange`) to determine whether any filter is active on first paint. If active, the wrapper is rendered without the `hidden` attribute so it is visible before hydration; otherwise it starts hidden and is revealed by a `data-wp-bind--hidden="!state.hasActiveFilters"` directive once JS hydrates.
- The block inspects both `activeFilters` (discrete taxonomy / post-type selections) and `priceRange` (WooCommerce price range) so a price-only deep link does not keep the wrapper hidden after hydration.
- Individual pills are rendered client-side via `data-wp-each` iterating over `state.activeFiltersList`.
