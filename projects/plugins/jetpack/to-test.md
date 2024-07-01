## Jetpack 13.6

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

### Testing with WordPress Release Candidate

The WordPress 6.6 RC 1 [is planned](https://make.wordpress.org/core/6-6/) for a release on 25th of June, 2024. Please update your site to the latest RC if you're testing at the time when it is already available.  

### Masterbar package

The Masterbar module is now a Jetpack package, and we should test to make sure the features are loading as they are supposed to.

#### RTL support

Update your user locale to Arabic and ensure the Masterbar and Admin menu is displayed as it should be. To make sure you can switch back to the current version of Jetpack and visually compare locations of text and controls.

#### WP Admin

There should be no visible option to customize your WP Admin view in the top right side of your admin area.

### Google Analytics package

The Google Analytics API code has been moved into a separate package as well, and this change needs testing. For this you need to make sure your Jetpack plugin is connected. You'll need a way to manage WordPress options to test this, WP CLI is preferred:

- Deactivate the Google Analytics feature if enabled.
- If exists, alse delete the `jetpack_wga` option (`wp option delete jetpack_wga`).
- Go to "Jetpack -> Settings -> Traffic", purchase the plan.
- Go there again and click on "Configure your Google Analytics settings".
- In Calypso, scroll down to "Google" card and activate it.
- Check `jetpack_wga`, confirm the setting `is_active: true` is now stored.
- Go to the Jetpack site, find "Modules" section (`/wp-admin/admin.php?page=jetpack_modules`), and confirm that Google Analytics module is active.
- Add a Measurement ID (e.g. G-12345), click "Save". Check `jetpack_wga`, confirm the Measurement ID and `is_active` are correct, and other settings show up and valid.
- Reload the page, confirm Google Analytics is still active, and Measurement ID is preserved.
- Load the site's frontend, check the page source code to confirm the Measurement ID is added to the page.
- Deactivate "Add Google". Check `jetpack_wga` option, confirm `is_active: false`, and the rest of the settings didn't change.
- Visit Jetpack's Modules page, confirm the module got disabled.
- Check the frontend and confirm that the measurement ID has now disappeared.
- Reload the Calypso page, confirm "Add Google" is still deactivated. Turn it on, confirm Measurement ID is still there.

### AI Form Assistant

The AI Form has been refactored, so testing is needed to make sure it's working as expected. When editing a post add a form and use the AI Assistant inline, use the video in [this pull request](https://github.com/Automattic/jetpack/pull/37589) for reference.

### Testing WordPress on Atomic sites

There were some changes that are specific to how Jetpack works in WordPress on Atomic sites. These apply if you're testing Jetpack in an Atomic environment:

#### Masterbar menu loading

Because the Masterbar module has been moved outside of the plugin into a package, some changes were made to how the code is loaded. For example, the admin-menu API endpoint loads code in a different way. 

To test that the code loads properly and there are no fatals, you can toggle the Admin Interface Style option in Settings -> General in wp-admin.

Testing the endpoint can be done using the [WPCOM REST API Dev Console](https://developer.wordpress.com/docs/api/console/). Query the `wpcom/v2/sites/YOUR_BLOG_ID/admin-menu` endpoint, and ensure the same response on WoA sites with previous Jetpack version, and with the latest alpha.

Try switching between Classic vs Default view in the top right corner of the admin area. Confirm nothing breaks and both views are displayed as expected. If you're testing on a WoA site with Jetpack SSO disabled, this option should not be available.

##### Admin color schemes

Upon editing a User Profile via wp-admin, confirm the Admin Color Scheme field is present, and ensure that by picking one of the options, the admin theme is updated. Because you're testing an a WoA site, this change should be also reflected in Calypso. 

When editing a user's profile via wp-admin on a WoA site, confirm that you see the message about changing profile's basic details, and the corresponding links to your WPCOM account page work as expected.

##### WordPress.com nudges

WordPress.com offers to purchase a plan to be able to customize CSS on your site. To test make sure your site is:

1. using a non-block theme, eg Hever.
2. IS NOT on the Explorer Plan.

Navigate to Appearance -> Additional CSS and confirm you see the nudge to purchase the Explorer Plan.

Ensure the Upgrade flow is working as expected by clicking the "Upgrade now" button. You should be redirected to checkout with the Explorer plan in your cart.

#### Jetpack Scan menu item

In order to expose the Jetpack Scan history to Atomic sites that are using the default wp-admin interface, there's a new Scan menu item. Make sure this link redirects to the Jetpack Cloud and shows only the history page of scans done.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
