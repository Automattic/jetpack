## Jetpack 15.7

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Image Compare block caption link fix

[Image Compare Block: Fix disappearing link bar when highlighting part of a caption](https://github.com/Automattic/jetpack/pull/47197)

Changes were made to fix an issue related to captions – previously if text was added as a caption, it wasn't possible to highlight that text and add a link. Now you should be able to highlight the text and see the toolbar allowing you to add a link.

To test:

1. Create a post with an Image Compare block.
2. Once the images are added, add a caption.
3. Highlight the caption and you should see the toolbar, allowing you to add a link.
4. Add a link and make sure that on save the link remains, as well as allowing you to highlight the text again and change the link.
5. Make sure general Image Compare block behaviour continues to work as expected.

### AI Assistant jitter fix

[Fix AI Assistant modal shaking when content streams in](https://github.com/Automattic/jetpack/pull/47616)

Prior to this PR, the AI Assistant would violently shake while outputting content. To test the fix:

1. Open a post in the block editor.
2. Open the AI Assistant from the Jetpack sidebar.
3. Use "Optimize title" or request feedback on the post.
4. Observe the modal as text streams in — it should no longer shake or jitter.
5. If the modal content is long enough to scroll, verify the header stays pinned at the top.

### Admin menu and header tweaks

[Admin Menu: Improve navigation and header consistency](https://github.com/Automattic/jetpack/pull/47417)

**Menu Ordering**

1. Install and activate Jetpack with Backup, Scan, Subscribers, Activity Log, and Jetpack Manage features enabled.
2. Go to WP Admin → Jetpack.
3. Verify menu order:
   - Internal links appear first (My Jetpack, VideoPress, Social, Backup, Forms, etc.)
   - "Settings" appears as the last internal link
   - External links appear after Settings (Activity Log ↗, Subscribers ↗, Jetpack Manage ↗, Scan ↗, VaultPress Backup ↗)

**Menu Titles**

Verify in the Jetpack menu:
- Akismet menu shows as "Anti-spam" (not "Akismet Anti-spam")
- Backup menu shows as "Backups" (not "VaultPress Backup")

**Button Component**

1. Go to Jetpack → Backups.
2. Verify the "Back up now" button displays correctly and functions properly.
3. Click the button and verify it shows loading state during backup queue.

**Header Consistency**

1. Visit various Jetpack admin pages (Backup, Forms, Search, etc.).
2. Verify header subtitle spacing is consistent across pages.

### WordPress 7.0 compatibility

The next stable release of WordPress is around the corner, so poke around at some of the new features that need testing. A partial list of features can be found [here](https://make.wordpress.org/core/). Report any compatibility issues you might find!
