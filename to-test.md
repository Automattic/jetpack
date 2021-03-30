## 9.6

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Instant Search

This release brings a lot of changes to the Instant Search feature; we would recommend looking at every aspect of the feature to see how things work:

1. Purchase a Search plan.
2. Go to Jetpack > Settings > Performance, enable Instant Search.
3. Go to Appearance > Customize > Jetpack Search and play with the different Jetpack Search settings.
4. Try the same on a site with WooCommerce products and reviews if possible.
5. Save your changes and see how the search overlay behaves on the frontend of your site.

### Blocks

#### Payment, Revue, Subscription Blocks

We've added a new "width" option to the buttons that can be added via multiple blocks in Jetpack; Payment, Revue, Subscription. To test this:

1. Create a new post and add one of those blocks.
2. Click on the button and try to customize its settings.
3. See how those settings look like on the frontend.
4. See that settings do not cause any issues when coming back to edit an existing post with such a button.
5. Try playing with both the percentage option and the pixel option for the button's width settings.

#### Star Rating Block

You should now be able to select 0 stars in a star rating block. To test this, try the following:

1. Create a new post and add a Rating block.
2. Click on the first star multiple times. The star should change from 1 star to 0.5 stars to 0 stars, then back to 1 star.
3. Try different changing from different star ratings and make sure the behavior is correct.
4. Set a star rating block to 0 stars and publish the post. Make sure that the published block displays correctly.

#### Tiled Gallery Block

We've improved the Tiled Gallery block so editing existing galleries does not create any errors. To test this, it's easier if there are already existing galleries on your site, using the tiled gallery block. Try editing posts containing such galleries; you should not see any errors or broken tiled gallery block in the editor.

#### Video Block

In this release, we now handle deleted videos better. To test this, you'll need:

- A Paid Jetpack plan
- The Videos option should be active under Jetpack > Settings > Performance

Once you're set with this, try the following:

1. Create a post and insert a Video block.
2. Upload a new video.
3. Publish the post.
4. Go to the Media Library and permanently delete the video.
5. Revisit the post in the editor. You will see a black placeholder. Clicking the block should allow you to access the normal block controls so you can delete the block/replace the video file.
6. Add a new video file instead of the now missing.
7. Update your post.
8. Visit post, the video should be displayed properly.

### Connections Flows

We continue to improve connection flows for a better first experience with the plugin. You can test a few things here:

1. Add the following snippet to your site before you connect the site to WordPress.com: `add_filter( 'jetpack_pre_connection_prompt_helpers', '__return_true' );`
1. You should see messages appear under the Media, Appearance > Widgets, and Posts pages (only if you have at least 5 published posts) before you connect your site to your WordPress.com account.
1. Those messages should not be displayed anymore once you've connected your site.
1. Check the "Recommendations" banner that appears on the main dashboard page and the main Plugins page once you've connected your site to WordPress.com; you should be able to either dismiss it easily (and it should not come back after that), or start the Recommendations process from there.

### SEO Tools

Until now, one had to go to the WordPress.com dashboard to change their SEO settings once the feature was enabled. That's no longer necessary. You can now manage all settings from your Jetpack dashboard:

1. Connect your site to your WordPress.com account
1. Go to Jetpack > Settings > Traffic
1. Enable the SEO Tools feature
1. Play with the different settings, save your changes, and ensure saving works well.
1. Ensure your settings are reflected on your site's frontend.
1. Try to activate another SEO plugin such as Yoast SEO or All In One SEO; the SEO settings should then be disabled.

**Thank you for all your help!**
