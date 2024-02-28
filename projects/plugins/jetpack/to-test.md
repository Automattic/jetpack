## Jetpack 13.2

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

### Stats Blocks

The `Top Posts & Pages` block and the `Blog Stats` block have been added which were previously available as legacy widgets

Please remember that views are only counted when the Stats module is active and when you're logged out. They are also cached for five minutes.

#### Top Posts and Pages Block

While testing the block, consider the following:

- Enable beta blocks as mentioned at the top of this file, then you can insert the block using the editor.
- The block should prompt you to activate the Stats module if it's currently disabled.
- There should be two layouts available from the Block Toolbar: the Grid layout and List layout.
- The block settings should feel intuitive, and they should all function appropriately:
  - Number of items: the number of posts displayed in the block.
  - Stats period: the timeframe for which to check top posts. For example, "7 days" should return the posts with the most views across the last week.
    - If you do not have enough content that has accumulated views in that timeframe, the block should draw on random posts.
    - It should not include password-protected or private content.
  - Items to display: filters out different content types (eg. posts or pages) depending on what you'd like the block to include.
  - Metadata settings: control what the block shows, such as the date or post author.
  - Style settings: the block should allow you to choose colours, margin, padding and fonts if your theme has opted in to that feature.
- Confirm that all these settings work as expected, and that the block displays correctly on the front-end.

#### Blog Stats Block

While testing the block, consider the following:

- Enable beta blocks as mentioned at the top of this file, then you can insert the block using the editor.
- There are two options to available: Views and Visitors.
  - These should match the statistics shown in your Dashboard.
- Unlike the legacy widget, you can now also show stats data for individual posts.
  - In order to test this, it's recommended that you insert the block into a template within the Site Editor.
  - Visitor data is not collected for individual posts. As such, you shouldn't be able to select "Visitors" and "This individual post" when adding the block.
- Confirm that the block correctly loads on the front-end and contains appropriate statistics.

### Jetpack SSO Improvements

There have been various improvements made to the Secure Sign On (SSO) feature. Since there was a considerable amount of refactoring, it's suggested to test the SSO feature overall. When testing, consider:

- Inviting a new user to your site whose email matches an existing WordPress.com account.
- Inviting a new user to your site whose email address has not been used yet to create a WordPress.com account.
- If possible, try managing users from both the WP Admin (example.com wp-admin/users.php) view, and the "Calypso" view (wordpress.com/people/team/example.com).

### Goodreads Block

The existing legacy widget for Goodreads is now available as a beta block.

- Enable beta blocks as mentioned at the top of this file, then you can insert the block using the editor.
- If you don't have a Goodreads account, you can use the following profile to test:
  - https://www.goodreads.com/author/show/1406384
- Try the various block settings and verify the results on the front-end of your site.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
