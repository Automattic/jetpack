## 6.9

### Admin Page

We've made several changes to the Admin Page in this release. This will have a big impact on new and existing Jetpack users alike. It impacts multiple screens and flows:

- You will notice changes when heading to Jetpack > Dashboard right after activating the plugin.
- You will notice a new card when coming back to your dashboard right after connecting the plugin to your WordPress.com account.
- You will notice some changes in the modals that are displayed in the Jetpack dashboard when coming back to your site after purchasing a plan.
- You will find a new "My Plan" section in the Jetpack dashboard.
- The sections and cards under Jetpack > Settings were also reorganized.
- We've starting working on improving the different notices that are displayed to you when changing settings.
- We've updated the message displayed to users who have not linked their own WordPress.com account on a site that is already using Jetpack.

To test this, try navigating through all those screens as a new site owner:

- Can you dismiss / use all action buttons?
- Can you find all sections and features you are looking for?
- Can you easily upgrade to a new plan?
- Can you toggle the different settings in the new "Performance" section?
- Do you spot any typos or mistakes in the texts that were added to the different screens?

### Block Editor

This release introduces new blocks we'd like you to test:

**Subscription block**

This block allows your readers to subscribe to your site, and will be available in the block editor if the Subscriptions feature is active on your site. To test it, try to activate the feature, and see if you can add the block, and use it to subscribe to your site.

Here are a few other things you can try:

- Toggle the "show number of subscribers" in the editor. Confirm that you see the number of subscribers when the block loses focus.
- After subscribing with a few different email addresses (and confirming your subscription), confirm that you see the number of subscribed users on the frontend (when the toggle was enabled for the block in the editor) and the editor when the block doesn't have focus.

**Related Posts Block**

This block allows you to add Related Posts anywhere within your posts and pages. Give it a try by adding it from the editor, and make sure it looks good on your site. The different block options should also work well.

Ideally, test this on a site that has some posts already, in order to be able to use the already indexed posts without the need to create related posts and wait for indexing.

**Tiled Gallery Block**

This block allows one to embed tiled galleries in their posts. It is available as soon as you connect Jetpack to WordPress.com. Try to use the block and its different layout options, and let us know what you think!

**Shortlinks**

It is now possible to view a post's shortlink in the Jetpack plugin sidebar. Give it a try when the feature is on, off, and make sure everything works as you would expect.

### Carousel

We have some changes to the Carousel feature to make sure it works with the different types of images now available. To test, try clicking on images inserted via those solutions:

- with a classic block and a classic gallery in it
- with a core gallery block
- with a new tiled gallery block
- with a classic block and a tiled gallery in it.

### AMP

We've made a number of improvements to the way Jetpack works with the latest version of the AMP plugin.

To test this, add the plugin to your site, and switch between the different modes under the AMP plugin options. You will want to check that the following features are working:

- Sharing buttons should be properly displayed.
- Stats should be recorded when you are visiting your site and not logged in to your admin account (look for call to the stats tracking pixel in your browser's network tab).
- You should not see any PHP notices.

### Shortcodes

This release also adds a new shortcode, `[jetpack-email-subscribe]`. You can use it to insert Mailchimp subscription forms anywhere in your posts and pages.

To use it, try the following:

1. Go to [https://wordpress.com/sharing/](https://wordpress.com/sharing/) and choose your test site.
2. Under the new Mailchimp section, connect your site to a Mailchimp account.
3. That's it! You can now use `[jetpack-email-subscribe]` anywhere on your site!

**At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**

**Thank you for all your help!**
