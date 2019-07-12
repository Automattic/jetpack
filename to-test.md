## 7.5

### Dashboard

This release introduces many small changes in the Jetpack dashboard. We've updating the wording that describes several features, we've removed a feature that would offer you to activate a list of recommended features upon connecting your site to WordPress.com, we've removed some of the buttons offering you to upgrade to a Paid plan on the "At a Glance" view, we've tried to describe each plan a little better, and more.

Do not hesitate to browse through all main Dashboard Pages ("At a Glance", "My Plan", "Plans", "Settings"). Check the phrases describing each feature, and let us know if you spot any typo or anything odd.

### Magic Links

This feature introduces a new option in the Jetpack dashboard. If you use one of the mobile apps, you'll now be able to send an email to yourself, from the Jetpack dashboard, with a magic link that will allow you to log in to the mobile app in one click. We would invite you to test two scenarios:

**Testing the error case:**

1. Ensure that Jetpack site is connected to a test account that **is** an Automattician account
2. Go to Jetpack > Dashboard
3. Click Connect to mobile WordPress app link. That link appears in the Connection area.
4. Ensure modal pops up
5. Click Send Link button
6. Ensure that an error message occurs (this is due to you being connected to an Automattician account)
7. Disconnect site

**Testing the success case:**

1. Reconnect site to a WordPress.com test user that **is not** an Automattician account
2. Click Connect to mobile WordPress app link
3. Ensure modal pops up
4. Click Send Link button
5. Ensure that you receive email with magic link

### VideoPress

We've made some changes to how video thumbnails were saved after uploading a video using Jetpack Videos, aka VideoPress. To test this, try the following:

1. Start with a site including a plan that supports Jetpack Videos
2. Go to Jetpack > Settings and enable the Video toggle.
3. Go to this page and select your site: https://wordpress.com/media/
4. Upload a video. After uploading, you may have to wait a few minutes for the video to be processed.
5. Refresh the page, and you should see a video thumbnail appear below the video icon for that video.
6. Try setting a different Video thumbnail there.
7. Go back to your site and enable the Image CDN option under Jetpack > Settings > Performance.
8. Add the following code snippet (here is how you can do it](https://jetpack.com/support/adding-code-snippets/)):
```php
add_filter('jetpack_photon_pre_args', 'jetpackme_custom_photon_compression' );
function jetpackme_custom_photon_compression( $args ) {
	$args['quality'] = 80;
	$args['strip'] = 'all';
	return $args;
}
```
9. Repeat steps 3 to 5, make sure video thumbnails appear nicely for existing and new videos.


### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticible and report anything you see.

**Thank you for all your help!**
