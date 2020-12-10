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
	- Contact Form
	- Tiled Gallery

Make sure those blocks still look good on your site as well as in the subscription email you'll receive.

### Sync

With the introduction of the wp_after_insert_post hook in WordPress 5.6 we are migrating the jetpack_publish_post asction from wp_insert_post so that the action consistently triggers after saving meta and terms.

To ensure there is no regression issues we need to validate Publicize still triggers for newly published posts using both WP 5.5 and 5.6.

- With WordPress 5.5 installed
- Connect your site to Social Networks using the instructions at https://jetpack.com/support/publicize/
- Go to Posts > Add New
- Add Sample content, and customize the social message using the instructions at https://jetpack.com/support/publicize/#sharing-new-posts
- Publish the post.
- Confirm the custom message has been shared by visiting your social media accounts.
- Upgrade your test site to WordPress 5.6
- Repeat the above steps and ensure it is shared to your social networks.

The jetpack_publish_post action also is used to trigger updates to elastic content, so verifying new posts show up in Instant Search results is another great way to test this change.

**Thank you for all your help!**
