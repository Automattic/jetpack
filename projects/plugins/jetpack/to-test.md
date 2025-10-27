## Jetpack 15.2

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Forms

#### Image Select Field

The image select field is under the beta flag, so to test it just enable beta blocks.

- Install the Code Snippets plugins then go to Snippets > Add New and use this code: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`.
- Save and enable the snippet.
- Test the block with different images, options, styles, etc.
- If possible, try different themes as well.
- Once a response is sent, it should be visible in the Forms dashboard.
- Try viewing the responses there and exporting them.

#### Other improvements

There are other small changes and new features for the Forms inbox

- [Added read/unread state to the UI](https://github.com/Automattic/jetpack/pull/45350)
- [Add response view actions](https://github.com/Automattic/jetpack/pull/45352)
- [More fun and elaborate empty states](https://github.com/Automattic/jetpack/pull/45421)

### Sharing Buttons Block

Related PRs: #45484

#### Testing Steps:

- Go to Posts > Add New
- Insert sharing buttons block
- Add Reddit button
- Verify new logo appears in editor
- Publish post
- View on frontend and verify new logo displays correctly

### Slideshow Block

Related PRs: #45500, #45164

#### Testing Steps:

##### Image Size Selection (#45500):

- Add Slideshow block with multiple images
- Wait for post to fully load
- Change image size via sidebar settings
- Verify change reflects immediately in editor
- Save post and verify correct size shows on frontend
- On Simple sites: Note that thumbnail size may differ from 150×150 (this is expected)

### Maps Block

Related PRs: #45476

#### Critical Fix – High Priority Testing

#### Testing Steps:

- Edit post or page content
- Add Map block
- Add a marker to the map
- Verify block renders properly without error message
- Add multiple markers
- Verify map updates to show region displaying all markers
- Confirm no “This block has encountered an error” message appears

### Newsletter Settings

Related PRs: #45368

#### Testing Steps:

- Go to Jetpack > Settings > Newsletter
- Enable the feature
- Scroll to “Sender name and reply-to settings”
- Select “Replies will be sent to the post author’s email”
- Verify explanatory text updates appropriately

### My Jetpack Page

Related PRs: #45474

#### Testing Steps:

- Enable Hello Dolly plugin
- Go to My Jetpack page
- Verify page displays correctly without visual issues
