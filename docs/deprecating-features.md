# Deprecating features

## Deprecating code

See the [coding-standards](/docs/coding-guidelines.md) document for more information about deprecating code.

## Adding deprecation notices in Jetpack

This refers to styled deprecation notices on specific admin pages, with custom calls to action, within the Jetpack plugin.

In the [`Deprecate`](/projects/plugins/jetpack/src/class-deprecate.php) class within the Jetpack plugin, an array of notices exists within the constructor. By default this includes just one demo notice.

In order to show a deprecation notice on WP Admin (dashboard only), Jetpack Settings and Dashboard page, as well as My Jetpack, you'll need to consider the following:

* The `show` property is optional, but setting it to false will ensure the notice will not display anywhere.
* The `hide_in_woa` property is also optional, and setting it to false will ensure the notice will not display on WoA sites.
* If you need to add custom conditions beyond whether a site is WoA, then it would be better to modify the `show_feature_notice` function within the `Deprecate` class, then add a check in `has_notices` so that the notice is not added to the `$notices` variable.

Notices show on the Jetpack Settings and Dashboard pages with the existing notice styling, as the notice array is passed to the Window object from the `Deprecate` class. If no notices are in that array, then none will show.

The existing notice display logic is based on cookies. If a notice is dismissed, a cookie is added. If that cookie exists when checked for, then the relevant notice won't show.

Other relevant files with deprecation notice logic include the [`JetpackNotices`](/projects/plugins/jetpack/_inc/client/components/jetpack-notices/index.jsx) class and the associated [`DeprecationNotice`](/projects/plugins/jetpack/_inc/client/components/jetpack-notices/deprecation-notice.jsx) itself. It also includes a JavaScript file where notice styles are added and where the cookie is set when a notice is dismissed [here](/projects/plugins/jetpack/_inc/deprecate.js).

