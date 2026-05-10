# Jetpack Search Blocks

This directory contains all block definitions for the Jetpack Search block editor integration.

## Search shell

These blocks compose the search query entry and result display region.

| Block | Description |
|-------|-------------|
| [`search-input`](./search-input/README.md) | Text input that drives Jetpack Search results. |
| [`search-results`](./search-results/README.md) | Container for the results region — bundles the results list, count, sort, load-more, and attribution. |
| [`results-list`](./results-list/README.md) | Renders search results, empty-state, and error messages. Supports `compact`, `expanded`, and `product` layouts. |
| [`results-count`](./results-count/README.md) | Displays the total result count. |
| [`results-sort`](./results-sort/README.md) | Controls the result sort order (dropdown, radio, or popover). |
| [`results-load-more`](./results-load-more/README.md) | Button that appends the next page of results. |
| [`powered-by`](./powered-by/README.md) | "Powered by Jetpack" attribution link. Required on free-plan sites. |

## Filtering

These blocks let visitors narrow search results by taxonomy, post type, date, or author, and let authors apply silent constraints.

| Block | Description |
|-------|-------------|
| [`filters`](./filters/README.md) | Vertical stack of filter blocks (sidebar layout). |
| [`filters-popover`](./filters-popover/README.md) | Compact popover trigger containing filter blocks. |
| [`active-filters`](./active-filters/README.md) | Pills showing currently selected filters. |
| [`clear-filters`](./clear-filters/README.md) | Button that clears all active filters. |
| [`filter-checkbox`](./filter-checkbox/README.md) | Checkbox filter for taxonomy, post type, or author dimensions. Eight inserter variations. |
| [`filter-date`](./filter-date/README.md) | Groups results into yearly or monthly date buckets. |
| [`filter-post-type`](./filter-post-type/README.md) | Silent author-configured post-type constraint (no front-end UI). |

## Out of scope (WooCommerce — separate task)

`filter-wc-attribute`, `filter-wc-price`, `filter-wc-price-slider`, `filter-wc-rating`, `filter-wc-stock-status`, `filters-product`.
