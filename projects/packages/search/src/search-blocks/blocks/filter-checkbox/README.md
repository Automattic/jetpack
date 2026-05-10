# Checkbox Filter

The Checkbox Filter block lets visitors narrow search results by selecting one or more values from a list — for example, filtering by Category, Tag, Author, or Post Type. Each selected checkbox updates results immediately.

<!-- screenshot placeholder -->

## When to use this block

Add this block inside a **Filters** or **Collapsible Filters** container. You can add multiple Checkbox Filter blocks to let visitors filter by different dimensions at the same time.

## Choosing what to filter by

When you insert this block, the editor offers ready-made variations for the most common filter types. Pick the one you need:

| Variation | What it filters |
|-----------|----------------|
| **Category** | WordPress post categories |
| **Tag** | WordPress post tags |
| **Post Type** | Content types (posts, pages, etc.) |
| **Author** | Post authors |
| **Product Category** | WooCommerce product categories |
| **Product Tag** | WooCommerce product tags |
| **Product Brand** | WooCommerce product brands |
| **Custom taxonomy** | Any other taxonomy registered on your site |

You can change the filter type later in the block settings panel without deleting and re-inserting the block.

## Available settings

### Filter heading

The label shown above the checkbox list. Each variation has a sensible default (e.g. "Category", "Tag"). Customise it to match your site's terminology — for example, rename "Tag" to "Topic" or "Category" to "Department".

### Show result counts

Shows the number of results next to each option (e.g. "Technology (42)"). Enabled by default. Turn this off for a cleaner look if counts aren't useful to your visitors.

### Maximum number of options

The maximum number of checkbox options to display. Defaults to 10. Set this lower (e.g. 5) to keep the filter panel short, or higher (up to 50) to expose more choices.

### Sort options by

Controls the order in which options appear:

| Option | Description |
|--------|-------------|
| **Count** (default) | Most results first — puts the most popular options at the top |
| **Alphabetical** | Options listed A–Z — predictable for visitors who know what they're looking for |

## Tips

- Add a **Category** and **Tag** filter to most content sites — these are the dimensions visitors most commonly want to filter by.
- Use **Alphabetical** sorting when your taxonomy terms have roughly equal counts and visitors know the names they're looking for (e.g. country names, product brands).
- Use **Count** sorting when you want to surface the most content-rich categories first.
- If your site has a custom taxonomy (e.g. "Genre", "Series", "Department"), use the **Custom taxonomy** variation and select it from the settings panel.
