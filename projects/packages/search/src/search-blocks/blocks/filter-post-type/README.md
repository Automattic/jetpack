# Post Type Scope

The Post Type Scope block is an invisible editorial control that limits which types of content Jetpack Search returns. It has no visible output for site visitors — it works silently behind the scenes.

![Post Type Scope block in the editor — visible to the author, hidden on the front end.](../.docs-assets/filter-post-type.png)

## When to use this block

Use this block when you want to restrict the search results to specific content types without exposing the filter to visitors. For example:

- A documentation site that only wants search to return pages (not posts or media).
- A blog that wants to exclude media attachments from results.
- A membership site that wants to surface only certain post types to all visitors.

> **Looking for a visitor-facing post type filter?** Use the [Checkbox Filter](../filter-checkbox/README.md) block with the **Post Type** variation instead. That block shows visitors a checkbox list to filter by post type themselves.

## Available settings

### Mode

Choose whether the post types list works as a denylist or an allowlist:

| Mode | Description |
|------|-------------|
| **Exclude** (default) | The selected post types are removed from results. Everything else is included. |
| **Include** | Only the selected post types will appear in results. Everything else is excluded. |

### Post types

Select the post type slugs to include or exclude. Common post types:

| Slug | Content type |
|------|-------------|
| `post` | Blog posts |
| `page` | Pages |
| `attachment` | Media uploads |

Custom post types registered by themes or plugins also appear here. The block remembers a separate selection for each mode, so flipping between Include and Exclude doesn't lose your typed list.

## Examples

**Show only blog posts and pages:**
Add this block, set mode to **Include**, and select `post` and `page`.

**Hide media attachments from results:**
Add this block (default mode is Exclude), and select `attachment`.

## Tips

- If the block is added but no post types are selected, it has no effect.
- You can add multiple Post Type Scope blocks — their constraints are combined automatically.
- This is the right choice when the content type restriction is an editorial decision, not something visitors should control.
- Post types whose own registration sets `exclude_from_search => false` are filtered out server-side regardless of this block, so adding `attachment` to an **Include** list won't expose attachments unless the post type itself is searchable.
