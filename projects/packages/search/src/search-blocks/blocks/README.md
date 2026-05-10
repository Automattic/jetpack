# Jetpack Search Blocks

Jetpack Search provides a set of blocks you can combine in the Site Editor or Page Editor to build a fully customisable search experience. All blocks update results instantly as visitors type or apply filters — no page reload required.

## How to build a search page

1. Create a new page (or open your search template in the Site Editor).
2. Add the **Search Input** block where you want the search box to appear.
3. Add the **Search Results** block below it — this automatically includes a results list, count, sort control, "load more" button, and attribution.
4. Optionally add a **Filters** block in a sidebar column to let visitors narrow results by category, tag, date, author, or post type.

## Search shell blocks

These blocks make up the search query input and results display area.

| Block | What it does |
|-------|-------------|
| [Search Input](./search-input/README.md) | The search box where visitors type their query. |
| [Search Results](./search-results/README.md) | Container for the results area — comes pre-built with count, sort, list, load-more, and attribution. |
| [Results List](./results-list/README.md) | Displays the actual search results. Choose between compact, expanded, or product layouts. |
| [Results Count](./results-count/README.md) | Shows how many results were found (e.g. "1,234 results for 'wordpress'"). |
| [Sort By](./results-sort/README.md) | Lets visitors change the order of results (newest, oldest, relevance, etc.). |
| [Load More](./results-load-more/README.md) | A button that loads the next page of results without a page reload. |
| [Powered by Jetpack](./powered-by/README.md) | Attribution link — required on the free Jetpack Search plan. |

## Filtering blocks

These blocks let visitors (or site editors) narrow search results.

| Block | What it does |
|-------|-------------|
| [Filters](./filters/README.md) | A vertical sidebar-style panel containing filter blocks. |
| [Collapsible Filters](./filters-popover/README.md) | A compact button that opens a filter panel — good for search bars in headers or tight layouts. |
| [Active Filters](./active-filters/README.md) | Shows the currently applied filters as dismissible pills. |
| [Clear Filters](./clear-filters/README.md) | A button that removes all active filters at once. |
| [Checkbox Filter](./filter-checkbox/README.md) | Lets visitors filter by category, tag, author, post type, or any custom taxonomy. |
| [Filter by Date](./filter-date/README.md) | Lets visitors narrow results to a specific year or month. |
| [Post Type Scope](./filter-post-type/README.md) | Silently limits search results to specific post types — no visible UI for visitors. |

## Choosing a filter layout

**Use Filters** when you have a sidebar layout and want filters always visible alongside results.

**Use Collapsible Filters** when you have a compact layout (e.g. a header search bar) and want filters available without permanently occupying space.

Both layouts support the same set of filter blocks inside them.

---

> WooCommerce-specific filter blocks (`filter-wc-attribute`, `filter-wc-price`, `filter-wc-rating`, `filter-wc-stock-status`, `filters-product`) are documented separately.
