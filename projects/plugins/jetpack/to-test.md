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

### Jetpack Forms

There were 23 PRs for Jetpack Forms merged since the Jetpack 14.3 release, so it would be worthwhile to do a general test of forms functionality. The following testing flow will do that while also testing a number of specific changes.

Add a new Jetpack form:
- Choose the simple Contact Form when prompted. 
- Make it so name and email are not required. 
- Add date, number, radio, multiple choice fields. Publish.

On frontend:
- Try submitting the form empty. Confirm you are prompted to fill out at least one field. 
- Then fill out the field like normal and submit. 
- Confirm the submission details look correct under Dashboard > Feedback. 

Specific things we're testing in this flow: the number field (new); the date/radio/multiple choice fields (all had several changes); preventing empty form submissions; and general form creation and submission to ensure no major regressions.

### Jetpack Tiled Gallery

It is now possible to add custom links to images in Tiled Gallery blocks. To test:

- If you had any existing Tiled Gallery blocks on your test site, make sure there are no block validation errors when reloading the post editor after you’ve selected the ‘Bleeding Edge’ option in the beta tester plugin.
- For existing or new Tiled Gallery blocks, click on any Tiled Gallery image and notice the new option under 'Link to' - Custom. Select this, and add a URL for an image. Navigate to other images and back to that image - the URL should still be there (If valid). Click save, refresh the page, and the URL should remain.
- Open up the post on the front-end, and click on the image with the link - it should open that link in the same tab. You'll need to make sure Carousel is disabled on the site as the default Carousel behavior will take precedence otherwise - /wp-admin/admin.php?page=jetpack#writing.
- Try changing the 'Link To' options - they should all behave as they did before. Once you return to 'custom', the previously saved link should still be there.
- Try adding an invalid URL - such as 'not-a-url'. On clicking away from the 'Link URL' field, that value should be cleared. On returning to the image in question, the custom link entry should be blank.
- Test adding and removing images to the Tiled Gallery (click the 'Edit' icon in the block toolbar, then 'Add to Gallery', to add) - this should not affect the custom links that have been previously added (nor on the front-end either).

There should be no new console warnings or errors throughout this process.

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

### Portfolio and Testimonial CPTs

#### Removed when using block themes

For sites using block themes, testimonials and portfolios aren't shown as options to toggle on and off, unless either is already active. To test:

- Install and activate a legacy theme such as Twenty Fifteen.
- Enable both Testimonials and Portfolios (either at Jetpack > Settings > Writing - /wp-admin/admin.php?page=jetpack#writing, or Settings > Writing - /wp-admin/options-writing.php).
- Add a couple of Testimonials and Portfolio items - making sure there is at least one published portfolio or testimonial (not just draft or trashed versions).
- Switch to a block theme such as Twenty Twenty Four. The toggles should still be visible on settings page, but only for the custom content type that you had any published items of. Similarly the menu item for only the relevant custom post type should be visible in the main wp-admin menu.
- Trash those published versions, and refresh the settings page - the toggle should no longer be visible. The menu items should be gone as well.
- Experiment with switching between legacy and block based themes with different settings. The only case in which testimonials or portfolios should remain active on block based themes if the toggles were previously active and there were published items of either.
- You can also experiment with switching between themes that add support for testimonials or portfolios (for example Lodestar (Testimonials and Portfolios), Dara (Testimonials), Sketch (Portfolios), and block themes. When switching back to the block theme, the toggle and menu display should be the same as when testing with other legacy themes.
- Test that the toggles behave as expected and the feature itself works as expected when toggled on (you can add portfolios / testimonials, and view them).

The above behavior can be bypassed with a filter. You can test this out by adding a functionality plugin like ‘Code Snippets’, and adding the following snippet:
```
add_filter( 'classic_theme_helper_should_display_testimonials', function( $should_display ) {
    return true;
} );
```

This filter will ensure testimonials are now options on both settings pages, regardless of theme or whether there are published items. You can do the same for portfolios with the filter name classic_theme_helper_should_display_portfolios.

### Primary Connection Owner disconnecting
It is now possible to disconnect any user in My Jetpack. If the user is not the primary connection owner, they need to click on the Manage connection link and choose the Disconnect account link. The site connection will remain unaffected.

If the user is the connection owner, a modal window will open explaining that disconnecting the connection owner will disconnect all other users, too.

- Add several users to the site. There should be at least two admin users. Connect them to different WPcom accounts.
- Disconnect some of them from MyJetpack but not the connection owner. Reconnect them.
- Try disconnecting the connection owner. Choosing to disconnect should disconnect all other users. Site connection should remain.

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
