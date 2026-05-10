# Filters

The Filters block is a vertical container that holds individual filter blocks in a sidebar-style layout. Visitors use the filters inside to narrow search results — by category, tag, date, author, post type, or any custom taxonomy.

![Default Filters block in the editor — Active Filters, Clear, Category, Tag, Author, Post Type, Date, Post Type Scope.](../.docs-assets/filters-default.png)

## When to use this block

Use the Filters block when you have a sidebar column or a dedicated filter area that should always be visible alongside results. It works best in wide layouts where there is enough space to show the filters permanently.

If you need a more compact option — for example, a search bar in a page header — use the [Collapsible Filters](../filters-popover/README.md) block instead.

## What's included by default

When you first add this block it contains the following inner blocks (each can be removed, rearranged, or duplicated):

| Default inner block | What it is |
|---------------------|------------|
| [Active Filters](../active-filters/README.md) | Pills showing currently applied filters; clicking one removes it. |
| [Clear Filters](../clear-filters/README.md) | Button that removes all active filters at once. |
| [Filter by Category](../filter-checkbox/README.md#filter-by-category) | Checkbox list for the WordPress Category taxonomy. |
| [Filter by Tag](../filter-checkbox/README.md#filter-by-tag) | Checkbox list for the WordPress Tag taxonomy. |
| [Filter by Author](../filter-checkbox/README.md#filter-by-author) | Checkbox list of post authors. |
| [Filter by Post Type](../filter-checkbox/README.md#filter-by-post-type) | Checkbox list of content types. |
| [Filter by Date](../filter-date/README.md) | Year-based date buckets (configurable to month). |
| [Post Type Scope](../filter-post-type/README.md) | Silent constraint — limits which post types are searchable; renders nothing for visitors. |

## Adding more filters

Click the **+** icon at the bottom of the Filters block to insert any of these:

- Any [Checkbox Filter](../filter-checkbox/README.md) variation — Category, Tag, Post Type, Author, Product Category, Product Tag, Product Brand, or Custom Taxonomy. Each appears as its own card in the inserter.
- [Filter by Date](../filter-date/README.md)
- [Active Filters](../active-filters/README.md)
- [Clear Filters](../clear-filters/README.md)
- [Post Type Scope](../filter-post-type/README.md)

To remove a filter, select it and press Delete or use the block options menu. You can add multiple Checkbox Filter variations — for example, Category + Tag + Author all in the same panel.

## Styling

Use the standard block styling controls in the editor sidebar (color, spacing, border, typography) to style the filter panel's wrapper. Each inner filter block can also be styled individually.

## Tips

- Place the Filters block in a sidebar column next to the **Search Results** block for the classic two-column search layout.
- Put **Active Filters** and **Clear Filters** at the top so visitors can see and remove what they've applied without scrolling past the controls.
- Don't pile in every Checkbox Filter variation just because you can — pick the two or three dimensions visitors actually need. A long filter panel hurts mobile UX more than it helps discovery.
