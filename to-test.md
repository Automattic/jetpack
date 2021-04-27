## 9.7

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.


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

**Thank you for all your help!**
