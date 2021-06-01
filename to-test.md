## 9.8

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Story Block

The Story block is now available from the block inserter in web browsers (previously available in the mobile apps). The Story block allows you to combine photos and videos to create an engaging, tappable full-screen slideshow on your site’s posts and pages.

When testing it out, try:

- Using both photos and videos to create a Story
- Once published, try viewing your Story on different web browsers and mobile devices
- Change site themes and make sure the Story still looks great
- Try playing a Story using your keyboard: tab to focus on player, space to play/pause, escape to leave fullscreen

### Connection Flow

We've made some minor changes to Jetpack's connection flow in this release.

You'll want to try connecting your site to WordPress.com in different browsers, while logged in or logged out of your WordPress.com account, and ensure that connection is always possible.

In addition to that, we would recommend that you go through the Jetpack Settings screen after connecting to WordPress.com. Ensure that you can enable all features, apart from those that require a paid plan.

### Contact Form

There have been a couple changes to the Contact Form:

- Contact Form block: you are now able to set a custom header message shown after successful form submission
- Double quotes around names are removed in email headers for emails sent via the Contact Form

### Embeds

Instagram Reel permalinks are now able to be embedded:

- On a post add an Instagram block
- Enter the Reel URL which should automatically embed

### Instant Search

Improvements were made to Jetpack Search, a paid upgrade to the Jetpack plugin that provides higher quality results and an improved search experience.

To test, try:

- On a site with Jetpack Search, open the Customizer > Jetpack Search settings. There is now an option to only open the search results overlay once a user has submitted their search, rather than showing instantly as typing occurs
- Run some test searches and make sure results appear as expected and that there are no design conflicts
- Try switching themes and again check for any design conflicts with the search results overlay

### Carousel

We've made additional improvements to the Carousel feature in this release. To test it, try the following:

1. Go to Jetpack > Settings in your dashboard, and ensure that the Carousel feature is enabled.
2. Scroll down to the bottom of the page, click on the "Modules" menu item, and ensure the Tiled Galleries feature is enabled in the Module list.
3. Go to Posts > Add New, and add media to your post in different ways:
	- single image block linking to an attachment page
	- tiled gallery
	- gallery block
	- gallery in a classic block
	- tiled gallery in a classic block

You'll want to make sure Carousel works as expected in all scenarios, in different browsers. You can also test things when disabling Jetpack's Site Accelerator under Jetpack > Settings > Performance.

**Thank you for all your help!**
