## Jetpack 13.3

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

### The usual stuff

We have made changes to the connection flow, deprecated some old methods, and did some general cleanup. Please test the connection flow. Be creative - try stopping half-way, try plans, try disconnecting, etc. Bonus points for trying it in different locales. Good places to test locales: Jetpack Notifications, Facebook sharing buttons, Instant Search, etc.

### Newsletters

- Go to Settings > Newsletter.
- You should not see the "Follower Settings" section, and the other settings ("Blog follow email text", "Comment follow email text", "Welcome email text") should match this post: pdDOJh-3a8-p2.

### Gutenberg blocks

This release changes the way AI quick actions work for supported block types. To test:

- Go to the editor and create a list with some items.
- Click on the toolbar's AI icon.
- Confirm that the dropdown doesn't offer "Summarize", "Expand", or "Simplify". It should only offer "Turn into a table" and "Write a post from this list".
- Test both quick actions.
- Verify expected output (be mindful that not all lists would make sense as a table, try using some shared data between items, like "Africa, 200 people" and "Europe, 100 people").
- Confirm that the paragraph's quick actions still work as expected.

### SSO Survey 

This release enables us to gather more data on the reasons why users are disabling the SSO module. When a user disables the SSO module, we show a modal that leads to a Crowdsignal survey.

- Go to /wp-admin/admin.php?page=jetpack#/settings
- A modal should show when you disable the SSO module.
- Take the survey.
- Verify the correct userId is added to the survey URL.
- Verify the survey modal does not display multiple times if you disable/enable the SSO module.

### Newsletter

#### Jetpack sites

- Apply this PR to your Jurassic Tube site.
- Go to the Newsletter Settings page with both flags enabled: `wp-admin/admin.php?enable-email-settings=true&enable-newsletter-categories=true&page=jetpack#/newsletter`
- Perform tests on all cards and verify the disabled state is consistent.

- Go to the Newsletter settings page with the feature flag enabled: `/wp-admin/admin.php?enable-email-settings=true&page=jetpack#/newsletter`
- The Email Settings module should be displayed.
- Perform tests on both Featured Image and Excerpt inputs, verifying the data is correctly synced with the settings on WP.com.
- Remove the feature flag to make sure the Email Settings module is not displayed without the flag.

#### Contact Forms

The Contact Forms module has been refactored to use the new package instead of the older module shipped with Jetpack. Spend some time testing Contact Forms by adding Contact Form blocks and playing around with their settings. More details in the project thread: pf5801-Aj-p2

### Sharing

This release enables the "Sharing Settings" wp-admin page in offline mode or when the Classic (wp-admin) interface is enabled. The "Sharing Settings" page should look different depending on whether your site has a blocks or classic theme enabled.

The link in Jetpack > Settings > Sharing > "Configure your sharing buttons" now directs you to the "Sharing Settings" wp-admin page when Classic (wp-admin) interface is enabled.

#### WoA Sites

On a "Default" admin interface (non wp-admin) nothing should have changed.
On a "Classic" admin interface (wp-admin) the "Sharing settings" wp-admin page should be registered. To test this:

- Go to Appearance > Themes and install / activate a classic theme, e.g.: "Classic"
- Go to Jetpack > Settings > Sharing and enable sharing buttons.
- Click the the "Configure your sharing buttons" link that appears at the bottom of the "Sharing buttons" panel.
- It should direct you to the "Sharing Settings" wp-admin page located here: /wp-admin/options-general.php?page=sharing
- If your site is using a block theme the "Configure your sharing buttons" will link you to the site editor.

#### Jetpack Sites

Nothing should have changed for WPCOM connected Jetpack sites. Meaning the "Sharing Settings" wp-admin page should not be registered and the "Configure your sharing buttons" should link you to Calypso here: /marketing/sharing-buttons/[site_slug]

### New Sharing Buttons

- Go to Appearance > Themes.
- Install and activate the Twenty Ten theme.
- Go to wordpress.com/marketing/sharing-buttons/.
- Add a Bluesky sharing button to your site.
- After saving, it should look good on your site.
- Try using different button styles (official, icon, icon+text, text).
- Next, go to Appearance > Themes and switch to a block-based theme like Twenty Twenty Four.
- Go to Jetpack > Settings > Sharing and disable the sharing feature.
- Go to Apperance > Site Editor > Templates > Single Posts.
- Add a sharing buttons block to your template, and add a Threads button.
- Ensure it is displayed properly on the frontend, and that the button works well.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
