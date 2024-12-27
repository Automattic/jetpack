## Jetpack 14.2

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

Jetpack 14.2 has been affected by changes that aim to improve performance and reduce unused code. Please take note of any things that you think are wrong, if you see any such behavior. 

## Jetpack AI

### Featured Image

Previousl when a featured image was already set, the Featured Image generator modal showed up empty on open. Since Jetpack 14.2 , if a featured image is set, we load it on the modal for visibility. To make sure it works as intended, open the editor with a new post. Click on Sidebar's "Set featured image" and select "Generate with AI".

- Opening the featured image generator modal with not context (no post content nor title) should open and do nothing.
- If you close the modal, add a title or some content on the post and open the modal again, this time an image generation should trigger.
- If you set the generated image as featured image and close the modal and open the modal again, see the current featured image should show on the modal and no generation should be triggered.

### Thumbs up/down on AI Logo Generator

The Logo Generator now has thums up/down buttons for rating generated images. Testing them requires enabling beta blocks, as mentioned in the beginning of this document. To test this feature:

- Create a new post, insert a logo block, and use the AI logo generator to generate a new logo or browse your existing logos.
- Verify that there are no thumbs next to the "Use on block" button.
- Enable the feature: with `add_filter( 'ai_response_feedback_enabled', '__return_true' );`
- Reload your post and open the logo generator again.
- Verify that a thumbs up/down appears next to the "Use on block" button.
- You should be able to click on the thumbs up or down and observe that the thumb changes color.
- Viewing other logos you have should show their rating (which will likely be no rating), and if you go back to a logo you already rated the same rating should be present.
- Check that ratings are persisted after reload

## Support for Instagram Reels in AMP

In addition to support for Instagram Reel links Jetpack now supports reels and videos in AMP views. To test:

- Go to Jetpack > Settings > Writing and enable Shortcodes.
- Go to Plugins > Add New and install and activate the AMP plugin.
- Open the AMP onboarding wizard, and enable "Reader" mode.
- Go to Posts > Add New, make sure to add a shortcode block with the following content: `[instagram url="https://instagram.com/reel/COWmlFLB_7P/"]`
- Publish your post and view it on the frontend.
- You should see the embed work in regular view.
- Click on the AMP option in the admin bar.
- You should see the embed work in the AMP view too.

## Restaurant Menu and Testimonials CPTs

The Restaurant Menu Custom Post Type has been moved to a separate theme helper package. The package isn't being used yet, but we should make sure that nothing is being added via the package. To do that you would need to install and activate a theme that supports Restaurant Menus such as Confit:

- Add several new menu items from the new Food Menu in the admin menu.
- Add some new sections, and add menu items to specific sections (see the Menu Sections area in the menu editor). Ensure some sections are parents to other sections
- Attempt adding multiple menu items at once using the 'Add Many Items' menu option.
- Using quick edit from the main menu list for specific item, change the sections they belong to in some cases.
- Try dragging and dropping menu items to different positions and sections.
- Click save new order, everything should save correctly.

In addition to that, the Testimonials CPT is also now included from a separate package. To make sure things are OK:

- Ensure you can activate Testimonials via Jetpack > Settings > Writing (see the Custom Content Types section).
- Test that Testimonial functionality works as expected: Create a new Testimonial via the Testimonial wp-admin menu. View it. Add it to another post via the testimonial shortcode 	(`[testimonials]`).
- Test that a theme that supports Jetpack Testimonials auto-activates it: Make sure Testimonials are not active, and then install and activate the Lodestar theme. Testimonials should now be active.
- Try visiting /wp-admin/edit.php?post_type=jetpack-testimonial when Testimonial is toggled off - you should see an 'invalid post type' message, and on the front-end on a post which made use of the Testimonials shortcode, you should see the unrendered shortcode.
- Generally test that toggling on and off the Testimonials feature results in expected Testimonial functionality being visible and not visible - including the Testimonials menu item display in the main wp-admin menu.
- Test as well with the toggles at `/wp-admin/options-writing.php` (noting that toggling off isn't possible when a theme supports Portfolios or Testimonials), and Calypso Blue at `https://wordpress.com/settings/writing/yoursiteurl.com`.
- Test with Portfolios active and not active as well, in terms of how that impacts Testimonials, though there are some testing quirks around that depending on the theme (see below).
- Make sure there are no deprecation notices in error logs while testing.

**Thank you for all your help!**
