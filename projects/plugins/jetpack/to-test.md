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
- New Cookie Consent block, as described in https://github.com/Automattic/jetpack/pull/29197.
- Donations block is now available with free plans. Check that it works. Information at PCYsg-8Ns-p2#testing-payments may be helpful.
- Related Posts block can now have a header configured, and there's an author toggle.
- Subscriptions block is now available with the module disabled, prompting to enable the feature. See https://github.com/Automattic/jetpack/pull/29044 for details.
- Writing prompts: Visit a page like `/wp-admin/post-new.php?answer_prompt=1810`.

### Jetpack Forms:
Jetpack Forms continues to improve with changes in this release. In particular,

- Make sure things continue to work as expected.
- Check that the emails sent on a form response look good.

### Image CDN:
Enable the feature (Jetpack > Settings > Performance > Speed up image load times) and check that image-based features (e.g. Tiled Gallery, Flickr widget, gallery widget, image widget) still work.

### Sharing to Mastodon:
Enable Jetpack > Settings > Sharing > Jetpack Social connections. Then follow the testing instructions at https://github.com/Automattic/jetpack/pull/30661.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack/blob/monthly/branch-2023-04-25/projects/plugins/jetpack/CHANGELOG.md). Please feel free to test any and all functionality mentioned! 

**Thank you for all your help!**
