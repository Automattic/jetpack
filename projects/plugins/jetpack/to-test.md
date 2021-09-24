## 10.1

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Connection Changes

There were some connection changes in 10.1. It's recommended you test the flows as best you can. Here is a suggested flow: 

**Basic Flow:**

1. Disconnect Jetpack.
2. Go to the connection screen, confirm that it looks good.
3. Complete the connection process, confirm that it works as usual.
4. Disconnect Jetpack, confirm that the Connection Screen appears without reloading the page.

**In Depth Flows:**

1. Disconnect Jetpack, connect it in site-only mode (connect, but don't authorize the WordPress.com connection).
2. Go to Jetpack Dashboard, click "Connect" in one of the "Security" or "Performance" cards. The connection screen should appear, saying "Unlock all the amazing features..."
3. Click "Connect your user account". You should get redirected to Calypso connection flow. No need to "Approve" the connection for now, you can just go back to the Dashboard.
4. Scroll down to the "Account connection" card, click "Connect your WordPress.com" account. Confirm that the connection screen appears again.
5. Finish the connection, confirm that it works correctly, then disconnect. Connect again in site-only mode.
6. Go to "Settings", click "Connect your WordPress.com account" under one of the greyed out cards.
7. The connection screen should appear, but this time instead of the generic title, it should say "Unlock [feature name] and more amazing features".
8. Click "Connect your user account". You should get redirected to the Calypso flow. Complete the connection, confirm that it went fine.

### Carousel: Info and Comment Changes

When the Jetpack carousel is enabled, the info (i) should always appear even if "Display EXIF" is disabled, allowing you to select the option to see the full size of the image. The information and comments section should also be persistent and let you scroll down to view them without toggling them on every time you switch images.

Suggested flow: 

* Enable the carousel in Jetpack -> Settings -> Writing. Disable showing EXIF data.
* Add any gallery to a post. It will help if one of the images has a long description for testing.
* When viewing that image in the carousel, click the `i` info icon to expand the info section and scroll down.
* Without scrolling to the very top, advance the slide. The next slide should scroll to the top.
* The info section should still be toggled on. Similar behavior should exist for the comment section if that is toggled on instead of the info section.
* Toggle EXIF Data on. Behavior should be the same, plus any additional EXIF data that may exist for the images.
* Check on various screen sizes, mobile devices, etc.

Issues with Swiper specificity should also be fixed, improving compatibility with third party galleries such as Elementor. 

### Slideshow Block

Issues where the slideshow block wouldn't always respond to swipes/clicks has been addressed. Give the block a try! You should be able to zoom along. 

### Tiled Gallery - Fix issue with transforming.

Issues transforming the Jetpack tiled gallery to a regular core gallery block and back should be fixed.

* Add a Jetpack **slideshow** gallery and then transform it to a Jetpack **tiled** gallery. Make make sure the image elements are saved in the post content.
* Save the post and reload and make sure images still show in the tiled gallery
* Repeat by transforming for the **core gallery** and a single core **image block**. 

### Search

There were some large changes to Jetpack Search, a paid upgrade to the Jetpack plugin that provides higher quality results and an improved search experience!

The biggest is the ability to customize the search experience using a Gutenberg editor. 

* Make sure you've purchased a Jetpack Search subscription that is added to your site.
* Navigate to the new customization page at `/wp-admin/admin.php?page=jetpack-search-customize`.
* Ensure that the page renders a Gutenberg layout with a header, a sidebar to the right, and the Jetpack Search application in the center/left.
* Ensure that you can customize the search application via the controls in the options tab within the sidebar.
* Ensure that the "Jetpack Search" tab renders a description of customization interface and includes a link to the WordPress Customizer.
* Try resizing the page. Ensure that the page works as expected in all viewports ranging from mobile to desktop.

### Widget Fixes

This PR includes some fixes to the Facebook Page and Social Icons widgets. To test, make sure the option to use additional widgets is checked off in the Jetpack Writing settings. Test in both the Customizer and in WP-Admin under Appearance -> Widgets.

- Adding the Facebook Page Widget should let you enter a Facebook page URL without seeing an error about an incorrect URL on the front end.
- Social Icons - adding icons in both wp-admin and customizer should work and be retained upon saving.

**Thank you for all your help!**
