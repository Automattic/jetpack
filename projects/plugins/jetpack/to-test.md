## Jetpack 12.2

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### AI Assistant:
Jetpack 12.2 brings a new AI Assistant block. Given Automattic's current focus on AI, this should be tested. See p1HpG7-mHr-p2 for details.

### My Plan:
- Check all images are loading.
- "My Plan" card should no longer show on sites with a free plan but paid add-on features.

### Various block changes:
- Donations, Paid Content and Payment Buttons blocks are now available with free plans. Check that it works. Information at PCYsg-8Ns-p2#testing-payments may be helpful.
  - Subscriptions block also has a payment option, see pbNhbs-6Ju-p2#comment-15715
- Related Posts block can now have a header configured, and there's an author toggle.

### Jetpack Forms:
Jetpack Forms continues to improve with changes in this release. In particular,

- Make sure things continue to work as expected.
- Check that the emails sent on a form response look good.

### Image CDN:
Enable the feature (Jetpack > Settings > Performance > Speed up image load times) and check that image-based features (e.g. Tiled Gallery, Flickr widget, gallery widget, image widget) still work.

### Sharing to Mastodon:
* Make sure you have a Mastodon account.
* Make sure your test site has a Social Advanced or Complete subscription, and activate Social (from the My Jetpack section, for instance).
* Create a new post.
* Click on the Jetpack menu in the top bar.
* In the _Share this post_ section, click _Connect an account_.
* You should be redirected to wordpress.com. Enable the mastodon feature flag by adding the query parameter `flags=mastodon` and reloading the page.
* You should now have the option to connect your Mastodon account. Connect it.
* Go back to edit your post.
* You should now see Mastodon in the list of available services. Reload the page if you don't.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/monthly/branch-2023-04-25/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
