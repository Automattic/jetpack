# Search Input

The Search Input block adds the search box to your page. Visitors type their query here and results update automatically as they type.

![Search Input block in the editor.](../.docs-assets/search-input.png)

## When to use this block

Add this block wherever you want visitors to enter a search query — typically at the top of a dedicated search page or inside a header layout. It works alongside the **Search Results** and **Filters** blocks, which react to whatever is typed in the input.

## Available settings

Open the block settings panel in the editor to configure these options:

### Placeholder text
The text displayed inside the empty search box before a visitor types anything. Defaults to "Search…" if left blank. Use this to give visitors a hint — for example, "Search posts, pages, and more".

### Show search icon
Toggle the magnifying-glass icon inside the input on or off. Enabled by default. Turn it off if the design of your page already makes the input's purpose clear.

### Search on submit only
By default results update as the visitor types (live search). Enable **Search on submit only** to only trigger a search when the visitor presses Enter or clicks a submit button. Useful when your page layout is not designed for rapid updates, when you want to reduce the number of search requests, or for accessibility scenarios where rapid live updates can be disorienting for assistive-tech users.

## Tips

- The block automatically picks up a search query from the URL (e.g. `?s=wordpress`) when the page loads, so visitors arriving from a search engine or a link will see the correct query pre-filled.
- You can style the input using the block's color, spacing, typography, and border settings in the editor sidebar.
- Only one Search Input is needed per page — additional inputs all drive the same shared query state, which can confuse visitors.
