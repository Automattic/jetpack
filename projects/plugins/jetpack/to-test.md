## Jetpack 14.4

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

### Jetpack SEO Assistant (Beta)

The SEO Assistant feature has received some improvements. One of them is being able to keep the assistant window open when the sidebar is closed. Test it this way:

- Open the SEO Assistant from the Jetpack sidebar in the post editor.
- Close the sidebar.
- Check that everything works as before.

The excerpt panel styles have been fixed to address minor spacing issues. Make sure the form looks fine and works well.

### Jetpack Likes

Some time ago a new layout for the Like button was implemented, and Jetpack 14.4 removes that feature flag. You can see an example of the old layout [in this pull request](https://github.com/Automattic/jetpack/pull/41849). To test the new layout:

- Go to a post that has likes and open the popup with the full list of likers.
- Make sure you can see a popup containing people that like the post.
- Verify that this works as expected.
- The last thing you want to test is that the Likes widget placeholder is correctly displayed in the block editor by editing the site using the theme editor.

### Jetpack SSO

Before only connected admins on a site with an SSO module enabled were able to see who else has a connected account. This release will display the connection column to all admins regardless of whether they are connected or the SSO is used.

- Add two admins to the test site. One account should be connected, and the other should not.
- Try disabling and enabling SSO and make sure the Connection status is displayed for both admins.
- When SSO is on, the extra SSO features should be available. Try them out to make sure nothing got broken.

### Jetpack Social

The Jetpack Social service has undergone a refactoring under the hood and needs to have its core functionality tested:

- Login as an admin account.
- Confirm that you are able to connect social media accounts.
- Test at least with Facebook/LinkedIn, Mastodon and Bluesky.

Bonus points:
- Login as an author, the services list should now be cached.
- Try to connect an account.
- Confirm that there is no login to wpcom error.
- Confirm that the author is able to connect accounts.

### Jetpack Tiled Gallery

This release adds a fourth 'Link to' option for individual Tiled Gallery images - 'Custom'. This allows custom links to be added for each image if set. 'Silent' URL validation has also been added. What this means is that if the URL is invalid, it will be removed, so on returning to that image there will be no entry. To test first make sure Carousel is disabled on the site as the default Carousel behaviour will take precedence otherwise - `/wp-admin/admin.php?page=jetpack#writing`:

- Add a Tiled Gallery block to a post, with at least 3 images.
- Click on any Tiled Gallery image and notice the new option under 'Link to' - Custom. Select this, and add a URL for an image.
- Navigate to other images and back to that image: the URL should still be there (If valid).
- Click save, refresh the page, and the URL should remain.
- Open up the post on the front-end, and click on the image with the link: it should open that link in the same tab.
- Try changing the 'Link To' options, they should all behave as they did before. Once you return to 'custom', the previously saved link should still be there.
- Try adding an invalid URL, such as 'not-a-url'.
- On clicking away from the 'Link URL' field, that value should be cleared. On returning to the image in question, the custom link entry should be blank.
- Test adding and removing images to the Tiled Gallery (click the 'Edit' icon in the block toolbar, then 'Add to Gallery', to add). This should not affect the custom links that have been previously added (nor on the front-end either).

### VideoPress

This release fixes wrong flex positions for video inside row blocks, as well as overflow for multiple float videos on the same page. To test:

- Enable VideoPress on your test site.
- Create a post with a VideoPress block, using the center align option.
- The block should be centered on both the editor and the post itself.
- On another post, add a VideoPress block inside a Row block, using different flex positions.
- The video and the content should be correctly positioned on both the editor and the post.
- On another post, add a center-aligned VideoPress block, and below that add a regular VideoPress block.
- Both blocks should be rendered correctly, and the click area of the send block shouldn't overflow to the first block, meaning both blocks are clickable.
- Perform tests with multiple block combinations and make sure it works as expected.


**Thank you for all your help!**
