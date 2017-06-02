## 5.0

Jetpack 5.0 introduces a few visual changes in the Admin Interface, but most importantly we've made a ton of changes under the hood to clean things up and make Jetpack more performant. In this round of testing, we would encourage you to use as many different Jetpack features as you can, as almost all Jetpack features are impacted by this release.

### Admin Interface

While we haven't made many changes in the design of the Jetpack Dashboard, we've refactored most of its code. We would consequently really appreciate if you could play as much as possible with the different settings under Jetpack > Dashboard and Jetpack > Settings.

- Try disconnecting and reconnecting your site to WordPress.com.
- Try activating and deactivating features.
- Try changing options.
- Try to visit those pages as an editor or an author.

### Admin Notices

We've refactored the way Jetpack's admin notices are displayed in the dashboard. To test, you'll need to be in one of the following situations:
- Jetpack activated and connected to WordPress.com, while Akismet isn't active. Then visit the Comments menu in your dashboard.
- Jetpack activated and connected to WordPress.com, while VaultPress isn't active. Then visit Dashboard > Updates, or try to publish a new post and look for the notice appearing as soon as the pages refreshes once you hit the Publish button.
- Jetpack activated and connected to WordPress.com, WooCommerce active and with a shop configured to sell in the US or in Canada, while the WooCommerce Services plugin isn't active. Then visit your WooCommerce settings.

Make sure the notices displayed on those pages are correct, can be dismissed, and can be acted upon.

### Connection process

The connection process is a very important part of the Jetpack experience. It is, after all, one of the first things you do after activating the plugin. We've made some improvements to that process in this release, and we'd like you go through that process again on your site to make sure it works.

To get started, go to the Jetpack menu in your dashboard. Scroll down, and click on the "Manage site connection" link. Then confirm the disconnection.
Once you've done so, you should find a "Reset Options (dev only)" option at the bottom of the Jetpack menu page. Click on it to reset all options and start the connection process from scratch.

There are different ways to connect Jetpack to WordPress.com. Pick one, give it a try, and let us know how it goes!
- Log out of your WordPress.com account, and go to [this page](https://wordpress.com/jetpack/connect). Try creating a brand new account and then follow the steps to connect your site.
- Log out of your WordPress.com account, and then go to the Plugins menu in your dashboard, activate the Jetpack plugin, and follow the prompts to create a new WordPress.com account and link it to your site.
- Log out of your WordPress.com account, go to [this page](https://wordpress.com/jetpack/connect), and follow the steps to connect your site after logging back in to your existing account.
- Log out of your WordPress.com account, and then go to the Plugins menu in your dashboard, activate the Jetpack plugin, and follow the prompts to log back in to your WordPress.com account and connect your site.

### Widgets

WordPress core has a new Image Widget coming!  We're migrating your Jetpack Image widgets to use WP Core's new image widget. If you are running a WordPress version 4.8-alpha or above, please make sure that these new widgets (you know they are new because they do not have `(jetpack)` on the name), have been migrated over successfully.

We've made some changes to the EU Cookie Law Banner widget, to make sure it's always displayed properly, regardless of the theme you're using. To test, try the following:

1. Switch to a new theme under Appearance > Themes.
2. Enable the EU Cookie Law Banner widget under Appearance > Customize > Widgets
3. Check that the banner width spans the entire window at all screen sizes.
4. Check that, even at small screen sizes, the "Close" button is always positioned after the text, without covering it.

### WordPress.com and WordPress.com REST API

We've made several changes to the WordPress.com REST API in this release, and would appreciate your help testing communication between your site and the API in this Beta.

To do so, start by enabling the JSON API module on your site. It should be enabled by default, but you can also activate it manually by searching for "JSON" under Jetpack > Settings in your dashboard.

Then, use a tool that relies on the WordPress.com REST API to interact with your site. It could be the [Google Docs add-on](https://chrome.google.com/webstore/detail/wordpresscom-for-google-d/baibkfjlahbcogbckhjljjenalhamjbp?hl=en), an editor like [Stackedit](https://stackedit.io/editor), or [WordPress.com itself](https://wordpress.com/posts/).

You'll want to try to create new posts, editing existing ones, delete posts, adding media, and other content management actions.

Make sure everything works as advertized, and that there are no errors in the logs on your site, as explained below.

### Final Notes

During your tests, we encourage you to open your browser's Development Tools and keep the Console open, checking for any errors in the Console and the Network tabs.

To open the Console in Chrome or Firefox, you can press CMD+Alt+i in macOS or F12 in Windows.

We would also recommend that you check your site's `debug.log` as you test.

To make sure errors are logged on your site, you can add the following to your site's `wp-config.php` file:

```php
define( 'WP_DEBUG', true );

if ( WP_DEBUG ) {

	@error_reporting( E_ALL );
	@ini_set( 'log_errors', true );
	@ini_set( 'log_errors_max_len', '0' );

	define( 'WP_DEBUG_LOG', true );
	define( 'WP_DEBUG_DISPLAY', false );
	define( 'CONCATENATE_SCRIPTS', false );
	define( 'SAVEQUERIES', true );

}
```

**Thank you for all your help!**
