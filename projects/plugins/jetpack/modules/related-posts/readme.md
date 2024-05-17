# Related Posts

The basic code flow for Related Posts (legacy version) is:

1. Generate an empty DIV to be added to the page.
2. Make an API call to get the working post IDs.
3. Call `get_related_post_data_for_post()` for each ID.
4. Use generated data to update the DIV once page load is complete.

For the block-based version:

1. Make an API call to get the working post IDs.
2. Call `get_related_post_data_for_post()` for each ID.
3. Use generated data to render the block when called.

## Prerequisites

If using a block theme, the site-wide Related Posts setting will be ignored. For other themes, the site-wide setting is honored as long as a Related Posts block or shortcode is not found on the page. The Related Posts code paths will only output once per page.

In both cases, the feature needs to be turned on in the Jetpack settings. This makes sense for the legacy widget but can be a bit confusing for the block. It will not be visible in the block "picker" until enabled.

## API Usage

The block depends on wpcom for the working post IDs. See `get_related_post_ids()` for details. The returned data should look like this:

```
[{"id":919},{"id":9},{"id":903}]
```

Note the data used in rendering is all generated locally once the post IDs have been provided.

## Block Source

The source for the Gutenberg block lives separately at:

`projects/plugins/jetpack/extensions/blocks/related-posts/`
