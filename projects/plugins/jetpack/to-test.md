## Jetpack 14.3

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

## General testing

### Ensure Tiled Gallery images can be reordered and removed

1. Install and activate the Gutenberg plugin (v19.9+).
2. Add a Tiled Gallery block to a post or page, and add multiple images.
3. Try rearranging and deleting individual images within the Tiled Gallery block.

PR: https://github.com/Automattic/jetpack/pull/40779

### Allow HTML block within forms

1. Add a Form block to a page.
2. Add an HTML block inside the Form block.
3. Verify that the editor and frontend both function as expected.

PR: https://github.com/Automattic/jetpack/pull/41040

### Add a new default block when pressing enter on Form fields

1. Add a Form block to a page.
2. Add one or all of the following fields:
    * Text
    * Name
    * Email
    * URL
    * Telephone
    * Date
    * Single Checkbox
    * Consent
3. While a field block listed above is selected, press Enter.
4. Verify a new default block is created.

PRs:
* https://github.com/Automattic/jetpack/pull/41177
* https://github.com/Automattic/jetpack/pull/41297

**Thank you for all your help!**
