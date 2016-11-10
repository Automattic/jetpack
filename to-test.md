## 4.4

Jetpack 4.4 is packed with new things and improvements for your favorite modules! We're looking forward to getting your feedback on the following things:

### SEO Tools

Jetpack 4.4 tightens the links between Jetpack and WordPress.com, and now allows site owners using our [Jetpack Professional Plan](https://jetpack.com/features/) to manage SEO options from the WordPress.com interface.

To get started, go to Jetpack > Settings > Traffic and enable the SEO Tools module. Then, [go to Settings > SEO on WordPress.com](https://wordpress.com/settings/seo) in the WordPress.com dashboard. After you've picked your site, you should see a number of options on that page. Make sure they can be saved, and are applied on your Jetpack site.

You can learn more about the different options [here](https://en.blog.wordpress.com/2016/10/03/attract-more-visitors-to-your-business-site-with-our-advanced-seo-tools/).

### VideoPress

**VideoPress, our Premium video offering, has been completely redesigned to be fully integrated into your Media Library.** It's now easier to upload videos and insert them into your posts and pages.
We've also improved our Open Graph Meta Tags to make sure VideoPress videos can be embedded in your Facebook Posts.

To test this feature, you'll need to use [Jetpack Premium or Jetpack Professional](https://jetpack.com/features/) on your site. If you've purchased one of the upgrades, you'll be able to activate the VideoPress module under Jetpack > Settings > Writing.

![VideoPress upgrade](https://cloud.githubusercontent.com/assets/5528445/20008893/b296c05c-a278-11e6-89af-f086aac100fe.png)

Once the module is active, you can try the following:

1. Head over to Media > Library or Media > Add New, and try to upload a new video to your site. It should be uploaded to VideoPress right away.
2. Try uploading a video from your post editor, under Add Media.
3. A few minutes after the upload, the video's meta data should be updated (as transcoding finishes), and you can view and edit that meta data from the edit media page in the Media Library.
4. You should be able to insert those videos into any post or page.

### Shortcodes

**You can now embed Pinterest Boards, Profiles, and individual Pins in all your posts and pages.** To test this, paste a Pinterest URL on its own line, and it should transform into an embed in your editor as well as on your site.

### Widgets

We've added 2 new widgets to Jetpack:

**Google Translate**

The Google Translate Widget adds an option for your readers to translate your site on the fly into any language. To test it, enable the widget and pick a language in the dropdown while viewing any page on your site.

**My Community**

The My Community Widget allows you to show users who have recently interacted with your site. You can learn more about it [here](http://en.support.wordpress.com/widgets/my-community/). Add the widget to your site, and make sure it works as expected!

### Publicize / Subscriptions

We've made changes to improve the way both Publicize and Subscription emails were triggered whenever a post is published. To test this, try publishing posts, either by publishing them directly or by scheduling them.

We would also invite you to test the Publicize feature for Custom Post Types that support it, like Portfolios [or your own Post Types](https://jetpack.com/support/publicize/#custom-post-types).

### JITM & new plugin banners

We've made 2 changes to help new Jetpack users discover the plugin and its features, and help them get familiar with the different options.

To test the first change, disconnect Jetpack from your WordPress.com account thanks to the link at the bottom of the Jetpack menu. Once you've done that, head to the Plugins menu, deactivate the plugin, and then reactivate it. You should see a new banner at the top of the Plugins page, inviting you to connect to WordPress.com.

Do not hesitate to go through the whole connection flow again as we've also made some improvements there.

We've also added messages in different parts of the dashboard, depending on what Jetpack modules you use:

- If you don't use Akismet, you should see a message in the Comments menu.
- If you don't use VaultPress, you should see a message after publishing a post, at the top of the post editor.
- If you don't use VaultPress, you should see a message under Dashboard > Updates.

Once you dismiss one message, all other messages should disappear.

Try clicking on each notice, and make sure the link works whether you're logged in to WordPress.com or not.

### Admin Interface for non-admins

1. Enable the Stats module, and disable the Protect module
2. Access the Jetpack menu from a non-admin account. Make sure the user only sees what's relevant to their role, with no broken elements in the interface.
3. Log back in as an admin, go to Jetpack > Settings > Engagement > Site Stats, and grant that other user access to your stats.
4. Log back in with the other user. They should now have access to Stats.
5. Log back in as an admin, disable Stats and enable Protect.
6. Log back in one last time as the other user. The interface should still work.

During your tests, we'd encourage you to keep your browser console open, and check for any errors in the console and the network tabs.

**Thank you for all your help!**
