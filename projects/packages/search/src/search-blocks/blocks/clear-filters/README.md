# Clear Filters

The Clear Filters block adds a button that removes all active filters at once, returning search results to their unfiltered state.

**Editor preview:**

![Clear Filters button in the editor.](../.docs-assets/clear-filters.png)

**Settings panel:**

![Clear Filters block settings panel.](../.docs-assets/editor-clear-filters-inspector.png)

**Front-end view (when a filter is active):**

![Clear filters button on the front end.](../.docs-assets/fe-clear-filters.png)

## When to use this block

Add this block inside your **Filters** or **Collapsible Filters** container, near the top alongside the **Active Filters** block. Together they give visitors full control over their filter selections — removing filters one at a time (via Active Filters pills) or all at once.

This block is included automatically in both the **Filters** and **Collapsible Filters** default templates.

## Available settings

### Button label

The text displayed on the clear button. Defaults to "Clear filters" if left blank. Customise this to match your site's style — for example, "Reset", "Remove all filters", or "Start over".

### Hide when no filter is active

Checked by default — the button only appears once a visitor applies a filter. Uncheck this to keep the button visible at all times.

Most sites should leave this checked — showing a "Clear filters" button when there is nothing to clear can confuse visitors.

## Tips

- Keep the default "hide when inactive" behaviour on for a cleaner experience — the button only appears when it does something useful.
- Place the Clear Filters block directly after the **Active Filters** block so both controls appear together at the top of your filter panel.
