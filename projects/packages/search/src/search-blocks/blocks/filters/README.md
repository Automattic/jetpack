# Filters

The Filters block is a vertical container that holds filter blocks in a sidebar-style layout. Visitors use the filters inside to narrow search results by category, tag, date, author, post type, or any custom taxonomy.

<!-- screenshot placeholder -->

## When to use this block

Use the Filters block when you have a sidebar column or a dedicated filter area that should always be visible alongside results. It works best in wide layouts where there is enough space to show the filters permanently.

If you need a more compact option — for example, a search bar in a page header — use the [Collapsible Filters](../filters-popover/README.md) block instead.

## What's included by default

When you first add this block it contains:

- **Active Filters** — shows the currently applied filters as dismissible pills
- **Clear Filters** — a button to remove all active filters at once
- **Category** filter — checkbox list for post categories
- **Tag** filter — checkbox list for post tags
- **Author** filter — checkbox list for post authors
- **Post Type** filter — checkbox list for post types
- **Date** filter — list of years to filter by
- **Post Type Scope** — a silent constraint block (hidden from visitors)

You can remove any of these, rearrange them, or add more filter blocks from the block inserter.

## Adding and removing filters

To add a new filter, click the **+** icon at the bottom of the Filters block and choose from:

- **Checkbox Filter** — for categories, tags, authors, post types, or custom taxonomies
- **Filter by Date** — for yearly or monthly date ranges
- **Active Filters** — to show currently selected filters
- **Clear Filters** — to add a reset button
- **Post Type Scope** — to silently restrict which post types appear

To remove a filter, select it and press Delete or use the block options menu.

## Styling

Use the standard block styling controls in the editor sidebar (color, spacing, border, typography) to style the filter panel's wrapper. Each inner filter block can also be styled individually.

## Tips

- Place the Filters block in a sidebar column next to the **Search Results** block for the classic two-column search layout.
- Put **Active Filters** and **Clear Filters** at the top of the block so visitors can easily see and remove what they've applied.
- Add multiple **Checkbox Filter** blocks to let visitors filter by different dimensions at the same time.
