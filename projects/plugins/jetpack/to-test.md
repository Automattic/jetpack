## Jetpack 13.2

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).

### Stats Blocks

There are two new blocks in beta that utilise stats data: the Top Posts & Pages block and the Blog Stats block.

- Enable beta blocks on your site
  - You can do this by inserting the following snippet in the `wp-config.php` file: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
- Create a new post and insert the two blocks.
  - Both blocks should prompt you to activate the Stats module if it's disabled.
  - You should also be able to convert the Legacy Widgets into the new blocks.
- Please remember that views are only counted when the Stats module is active and when you're logged out. They are also cached for five minutes.

#### Top Posts and Pages Block

- There should be two layouts available from the Block Toolbar: the Grid layout and List layout.
- The settings should be feel intuitive, and they should all function appropriately.
  - Number of items: the number of posts displayed in the block.
  - Stats period: the timeframe for which to check top posts. For example, "7 days" should return the posts with the most views across the last week.
    - If you do not have enough content that has accumulated views in that timeframe, the block should draw on random posts.
    - It should not include password-protected or private content.
  - Items to display: filters out different content types (eg. posts or pages) depending on what you'd like the block to include.
  - Metadata settings: control what the block shows, such as the date or post author.
  - Style settings: the block should allow you to choose colours, margin, padding and fonts if your theme has opted in to that feature.
- Confirm that all these settings work as expected, and that the block displays correctly on the front-end.

#### Blog Stats Block

- There are two options to draw on: Views and Visitors.
  - These should match the statistics shown in your Dashboard.
- Unlike the Legacy Widget, you can now also show stats data for individual posts.
  - In order to test this, it's recommended that you insert the block into a template within the Site Editor.
  - We do not collect Visitor data for individual posts. As such, you shouldn't be able to select "Visitors" and "This individual post" when adding the block.
- In all cases, confirm that the block correctly loads on the front-end and contains the appropriate statistic.

Todo section intro:

- Todo testing steps

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
