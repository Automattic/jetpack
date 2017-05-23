## 5.0

5.0 is still in progress; [keep an eye on the changelog to find out more!](https://github.com/Automattic/jetpack/pull/7116)

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

We've made some changes to the EU Cookie Law Banner widget, to make sure it's always displayed properly, regardless of the theme you're using. To test, try the following:

1. Switch to a new theme under Appearance > Themes.
2. Enable the EU Cookie Law Banner widget under Appearance > Customize > Widgets
3. Check that the banner width spans the entire window at all screen sizes.
4. Check that, even at small screen sizes, the "Close" button is always positioned after the text, without covering it.

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
