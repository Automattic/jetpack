## 9.2

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

We've made some changes to multiple blocks in this release, to ensure that they look good even outside of the WordPress context, such as in RSS feeds or subscription emails.

To test those changes, try the following:

- Go to Jetpack > Settings
- Enable the Subscriptions feature
- Go to Posts > Add New
- Add a subscription block, and publish the post.
- Visit the post and subscribe to your own site with your own email address.
- Publish a new post, with some content and the following blocks:
	- Podcast
	- Slideshow
	- Pinterest

Make sure those blocks still look good on your site as well as in the subscription email you'll receive.

**Thank you for all your help!**
