# Search Results — `jetpack-search/search-results`

> Container for the Jetpack Search results region — bundles the results list, count, sort, load-more, and "Powered by Jetpack" attribution.

<!-- screenshot placeholder -->

The Search Results block is a **container (InnerBlocks)** block that wraps the result-display stack. It is pre-populated with a sensible default template; authors can rearrange, remove, or insert additional blocks from the inserter. The block itself contributes only the surrounding chrome (wrapper `<div>` with block-support-derived color, spacing, border, and typography styles); each inner block is responsible for its own markup and Interactivity API wiring.

The block is server-rendered (`render.php`) and serialises inner blocks via `save: () => <InnerBlocks.Content />`.

---

## Attributes

This block exposes no custom attributes. Styling is controlled entirely through the standard block-supports UI (color, spacing, border, typography).

---

## Default template

When first inserted the block is pre-populated with:

```
core/group (flex, space-between)
├── jetpack-search/results-count
└── jetpack-search/results-sort
jetpack-search/results-list
jetpack-search/results-load-more
jetpack-search/powered-by
```

---

## Allowed inner blocks

- `core/group`
- `jetpack-search/results-count`
- `jetpack-search/results-sort`
- `jetpack-search/results-list`
- `jetpack-search/results-load-more`
- `jetpack-search/powered-by`

---

## Block relationships

| Role | Block |
|------|-------|
| Children (pre-populated) | `results-count`, `results-sort`, `results-list`, `results-load-more`, `powered-by` |

No required parent block.

---

## Minimum example markup

```html
<!-- wp:jetpack-search/search-results -->
<!-- wp:jetpack-search/results-list /-->
<!-- /wp:jetpack-search/search-results -->
```

Full default template:

```html
<!-- wp:jetpack-search/search-results -->
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group">
<!-- wp:jetpack-search/results-count /-->
<!-- wp:jetpack-search/results-sort /-->
</div>
<!-- /wp:group -->
<!-- wp:jetpack-search/results-list /-->
<!-- wp:jetpack-search/results-load-more /-->
<!-- wp:jetpack-search/powered-by /-->
<!-- /wp:jetpack-search/search-results -->
```

---

## Rendering notes

- **Server-rendered** via `render.php`. The PHP renderer receives `$content` (the serialised inner block HTML) and wraps it in a `<div>` with `get_block_wrapper_attributes()`.
- **Free-plan attribution enforcement**: if the `jetpack-search/powered-by` block is absent from `$content` and the site is on the free plan, `render.php` appends a server-rendered `powered-by` block automatically to satisfy the attribution requirement. Paid-plan authors who remove the `powered-by` block see no forced colophon.
- The `save` function returns `<InnerBlocks.Content />` (not `null`) so inner block delimiters survive serialisation.
