## Jetpack 13.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

### Performance enhancement

This release includes numerous small improvements that are meant to reduce Jetpack's footprint in page load times. This is done by removing unnecessary database requests for disabled features, and the like. When testing Jetpack 13.9, please keep that in mind and observe any behavior that might be attributed to these performance optimizations. Try disabling/enabling Jetpack modules on the `/wp-admin/admin.php?page=jetpack_modules` legacy page and using the site. You can also try playing around with regular Jetpack settings both on the My Jetpack page, and in the Dashboard `/wp-admin/admin.php?page=jetpack#/settings`.

Please ensure that you can enable/disable the Jetpack SSO feature (Jetpack > Settings > Security) and can use it to successfully log in to the site after connecting it to WordPress.com.

### My Jetpack

The checkout flow for users purchasing plans has been reviewed and fixed for cases when a user doesn't have an initial connection. To ensure everything is working please follow these steps:

- Go to My Jetpack and connect your site, but not the user. You can do so by disconnecting Jetpack, clicking the Set Up button in wp-admin, and then not clicking the Authorize button in the connection flow on WordPress.com.
- Click on "Purchase a plan" on My Jetpack page, down next to the footer.
- Select any product (except CRM) on the pricing page and proceed to checkout.
- Purchase the product with credits (if you do it with the testing card, the receipt will return an error and will not be assigned to the site) and ensure you are prompted to connect your user account.
- Connect your user.
- Ensure the site is autofilled correctly.
- Ensure the license is automatically assigned to the site, and you have the plan you have purchased.
- Now go back to WP Admin and disconnect your user account (if needed, reconnect your site).
- Go to `/wp-admin/admin.php?page=jetpack#/dashboard` and select the Plans tab at the top.
- Repeat purchase steps and ensure the behavior is exactly the same.

### AI Assistant

This release of Jetpack enables the SEO title AI feature. To test it follow these steps:

- Go to the editor and add some content to the post (tip: use the AI Assistant to write 2 paragraphs about some theme, like "sailing on the Adriatic Sea").
- Look for the "Improve title for SEO" option on the sidebar. It should replace the old "Improve title" button.
- Click the "Improve title for SEO" button. The modal will show and display 3 suggested titles.
- Confirm there is a textarea at the top asking for target keywords. Use the input to add specific keywords and generate again.
- Confirm that AI tries to accommodate the keywords in the suggested titles.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
