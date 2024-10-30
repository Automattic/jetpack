## Jetpack 14.0

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

### AI Logo Generator

On top of the already available AI Logo generator, we've now added a styles dropdown to allow more control for the user without depending entirely on the provided prompt.

The logo generator is not available for free users, test with a plan or subscription. Also, it's currenlty available for a12s only (and will soon be open to public).

- Load the editor and add a Logo block.
- On the network tab you should see a request to `ai-assistant-feature`
  - If using an a11n account (or focing the filter to `true`), the response should include `featuresControl['logo-generator'].styles` as a collection of style objects.
  - If NOT using an a11n account, the `styles` property should be an empty array.
```
{
  ...
  featuresControl: {
    'logo-generator': {
      enabled: true,
      styles: [ COLLECTION OF SYLES HERE ]
    }
  }
}
```
- Use the block's AI toolbar button to open the Logo generator modal, you should see a style dropdown on the top-right corner
- Feel free to play with the styles to achieve different results
- Confirm that using style "Auto" will try to guess the style based on the prompt (AI query request) and set the style prior to sending the image generation request
- If possible, try different combinations of plans and cases:
  - use `add_filter( 'jetpack_ai_tier_licensed_quantity', function() { return 0 | 100 | 1; } );` on your `0-sandbox.php` file filter to mock free/tier100/unlimited plans
	- sandbox the API, but then don't connect to sandbox to mock a disconnected situation

### AI Image Generator

The styles added to the logo generator are now also available on general image creation.
It is currently only available for a12s as well, so test in a site where you are logged in with your A8c account.

The testing steps are the same as the logo generator steps above, except that now you should add an Image block instead and click on the "Generate with AI" button.

### Floating subscribe button

- Go to Jetpack -> Settings -> Newsletter.
- Enable the “floating subscribe button”. Enable newsletter features first if these toggles are disabled.
- On the frontend of the site, you should now see a floating subscribe button at the bottom/right corner.
- If you’re using a block theme, next to the toggle, you see “preview and edit.” Clicking this should bring you to the site editor, where you can modify the button’s appearance.

### Email Preview dropdown

- You can preview blog posts as an email from post editor’s “Preview” dropdown when using latest Gutenberg or current RC release of core WordPress.

### Newsletter default settings

- On a new Jetpack site, go to Jetpack -> Settings -> Newsletter, then:
	- **Featured image**: “Whether to include the featured image in the email or not” setting default to disabled, can you can change it here. The emails have feature image set when enabled, when disabled no featured images in emails.
	- **Excerpts**: From WordPress settings, set excerpt for RSS feeds enabled. In the newsletter settings, “For each new post email, include…” still defaults to “full text” and not to “excerpt”. New blog emails are sent in full, not as excerpt, while RSS feeds are shown with excerpts.
	- **Replies**: default is set to “comments”, not to “no replies” or “reply to author”.

### Don’t show subscription modals when a URL param is present

- Enable subscription modals on posts (“popup”) and frontend (“overlay”) in the newsletter settings.
- Try loading a post or the frontpage, the modal should pop up. Do not dismiss it!
- Add `?jetpack_skip_subscription_popup` to the URL and load the page again.
- The modal should not show anymore.
- Remove `?jetpack_skip_subscription_popup` from the URL. The modal/popup should remain hidden on subsequent reloads.

### Story block

- Create a “Story” block in a post/page.
- Upload a couple of images.
- Check the front-end: clicking on the block should “run the story” by switching pictures, not simply reload the page.

### WordPress 6.7 Compatibility

- Install the WordPress Beta Tester plugin.
- Go to Tools > Beta Testing, and set the plugin to use Beta/RC Only (as we’re now in the RC stage of the 6.7 release – nightly will give you 6.8).
- Go to Dashboard > Updates, and update to the most recent Beta/RC version of WordPress.
- Test the following:
	- Ensure that Jetpack (and standalone) features work as expected. Note and report any errors/warnings in error logs and console logs.
	- Add different blocks and test inspector controls.
	- Change the site language (from Settings > General), update the language (from `/wp-admin/update-core.php`), and test Jetpack features. Check for errors in the site’s error log.

### And More!

Other particularly noteworthy changes in 14.0 include:

- Support for Bluesky in Jetpack Social.
- Related Posts block can now be used on non-post CPTs.

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
