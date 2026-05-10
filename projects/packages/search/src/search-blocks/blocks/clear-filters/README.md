# Clear Filters — `jetpack-search/clear-filters`

> A button that clears every active filter.

<!-- screenshot placeholder -->

The Clear Filters block renders a button that resets all active Jetpack Search filters (both discrete taxonomy/post-type filters in `state.activeFilters` and the WooCommerce price range in `state.priceRange`) in a single click. By default the button is hidden when no filter is active, showing itself only after a visitor selects a filter. Authors can pin the button visible with the `hideWhenInactive` attribute.

The block is server-rendered (`render.php`) and hydrated by `view.js`.

---

## Attributes

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | `""` | Button label text. Defaults to the translated string `"Clear filters"` when empty. |
| `hideWhenInactive` | `boolean` | `true` | When `true` (default) the button is hidden while no filter is active. Set to `false` to keep the button always visible. |

---

## Block relationships

Typically placed as an early child of `jetpack-search/filters` or `jetpack-search/filters-popover`, after `jetpack-search/active-filters`. Has no InnerBlocks of its own.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/clear-filters /-->
```

With all attributes:

```html
<!-- wp:jetpack-search/clear-filters {"label":"Reset","hideWhenInactive":false} /-->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer mirrors `state.hasActiveFilters` on the server: it reads `state.activeFilters` and `state.priceRange` from the seeded Interactivity state to determine whether to render the button pre-hidden. This prevents a flash of the button on a fresh URL (no active filters) before JS hydrates.
- The Interactivity API action bound to the button is `actions.clearFilters`, which resets both `activeFilters` and `priceRange` in one shot.
- When `hideWhenInactive` is `false` the button is always rendered visible; clicks while no filter is active are no-ops.
