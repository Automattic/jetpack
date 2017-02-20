## 4.7

In Jetpack 4.7, we focused on fixing bugs and making some important performance improvements.

### Infinite Scroll

We fixed multiple Infinite Scroll bugs. To test, try the following:

- Scroll until no more items can be loaded via Infinite Scroll on your home page, and on archive pages such as tag pages. The footer should then be displayed properly.

### Sharing

This Beta includes some changes to the Email Sharing button. Try to add the button to a test site, and make sure you can share posts via email.

You can also try to install and activate [this plugin](https://wordpress.org/plugins/jetpack-shortlinks-for-sharing-buttons/), and make sure it doesn't break the Email sharing button.

### Shortcodes

Do you use [the Recipe shortcode](https://en.support.wordpress.com/recipes/)? You'll want to make sure the Print link works well in all browsers.

### Widget Visibility

We've made a lot of improvements to the Widget Visibility module. It's now easier and faster to manage visibility rules in your Widget settings.

We would like you to run tests on sites where you had created visibility rules in the past. Update to Jetpack 4.7 Beta, and make sure the rules still exist.
Once you've done so, create new widgets, apply different visibility rules for each one of them, and make sure the rules are respected on your site. Make sure to test rules on Tag and Category Archive Pages as well.

To get started, go to **Appearance > Customize > Widgets** or **Appearance > Widgets** in your dashboard!

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
