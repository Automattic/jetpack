## Jetpack 13.8

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).

### Blocks

#### Breve

- Make sure you are on the free plan.
- Check that Breve is not loaded.
- Add a Jetpack plan.
- Check that Breve is enabled.
- Hide the Jetpack AI Assistant block.
- Check that Breve is disabled.
- Unhide the block.
- Check that Breve is re-enabled without a need to reload.

#### Don't attempt to use blocks that aren't available

It's possible to globally disable blocks for the entire site. This impacts blocks' availability in the editor, but also any other place on the site that relies on them or their code. The old classic slideshow is a good example of that: when used with the AMP plugin, it attempts to display a Slideshow block instead of the classic slideshow in AMP views. This has been fixed, but please also feel free to do some exploratory testing anywhere else you suspect this could be an issue.

- Make sure the shortcodes module is active.
- Make sure the AMP plugin is active.
- In Media > Add New, upload a few images.
- In Posts > Add New, add a classic block.
- With the media modal, create a gallery, add the images.
- Pick the slideshow gallery type.
- Publish the post.
- Visit the post.
- In the admin menu bar, click on the AMP menu item to view the AMP version of the post.
- The slideshow block is displayed properly.
- Now go to Jetpack > Settings > Writing
- Disable the Jetpack Blocks
- Refresh the AMP page.
- You should see no Fatal errors. The block may not be displayed properly depending on your AMP settings on the site though.

### Fedivrerse creator meta tag from Mastodon connection

- Go to Jetpack > Settings > Sharing
- Enable Jetpack Social, and connect your site to a test Mastodon account.
- Go to Posts > Add New.
- Write a post and publish it. In the post sidebar, ensure the post is shared to Mastodon.
- Check the source of the post on the frontend: you should see this: .
- Disable Jetpack Social.
- Ensure the meta tag is gone, and that there are no errors on your site.
Enable Jetpack Social again.
- Now install and activate the ActivityPub plugin on your site.
- Check that same post again. The meta tag added by Jetpack should be gone.

### Masterbar feature has been removed for self-hosted sites

Note that this should only affect self-hosted sites and the features and WP.com toolbar should still load as expected on WoA sites.

- On the Jetpack modules page, there should be no listing for the WordPress.com Toolbar: `/wp-admin/admin.php?page=jetpack_modules`.
- On the Jetpack > Settings > Writing page, there should be no card for the WordPress.com Toolbar: `/wp-admin/admin.php?page=jetpack#/writing`.
- If the feature was previously enabled, on Jetpack dashboard pages, you should see a notice mentioning the removal. The notice should also be visible on other wp-admin pages, as well as in My Jetpack.### Before you start:

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
