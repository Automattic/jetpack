## 9.7

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Connection Flow

We've made several changes to Jetpack's connection flow in this release.

The first change you'll find is when browsing your site when Jetpack is active, but not connected to WordPress.com yet. You should see messages inviting you to connect to WordPress.com in 3 new screens:

- Appearance > Widgets
- Media
- The main Posts screen if you've published 5 posts or more.

Give those messages a try, and let us know how it goes.

You'll also want to try connecting your site to WordPress.com in different browsers, while logged in or logged out of your WordPress.com account, and ensure that connection is always possible.

In addition to that, we would recommend that you go through the Jetpack Settings screen after connecting to WordPress.com. Ensure that you can enable all features, apart from those that require a paid plan.

### Carousel

We've made improvements to the Carousel feature in this release. To test it, try the following:

1. Go to Jetpack > Settings in your dashboard, and ensure that the Carousel feature is enabled.
2. Scroll down to the bottom of the page, click on the "Modules" menu item, and ensure the Tiled Galleries feature is enabled in the Module list.
3. Go to Posts > Add New, and add media to your post in different ways:
	- single image block linking to an attachment page
	- tiled gallery
	- gallery block
	- gallery in a classic block
	- tiled gallery in a classic block

You'll want to make sure Carousel works as expected in all scenarios, in different browsers. You can also test things when disabling Jetpack's Site Accelerator under Jetpack > Settings > Performance.

### Plugin, theme, feature management on WordPress.com

Once you've connected your site to your WordPress.com account, you'll want to make sure you can install and manage plugins and themes from the WordPress.com dashboard. To test this, go to [wordpress.com/plugins](https://wordpress.com/plugins) and [wordpress.com/themes](https://wordpress.com/themes) and try interacting with your site.
You can also test deactivating and activating features from the Settings screen on WordPress.com ([wordpress.com/settings](https://wordpress.com/settings)).

Try making those tests with your browser's Network panel opened. If you experience issues, copy the response of the matching request in the network tools, like so:

![image](https://user-images.githubusercontent.com/426388/116233578-c2620b80-a75b-11eb-9729-2b35d1d7c108.png)

**Thank you for all your help!**
