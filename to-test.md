## 4.7

In Jetpack 4.7, we focused on fixing bugs and making some important performance improvements.


### Widget Visibility

We've made a lot of improvements to the Widget Visibility module. It's now easier and faster to manage visibility rules in your Widget settings.

We would like you to run tests on sites where you had created visibility rules in the past. Update to Jetpack 4.7 Beta, and make sure the rules still exist.
Once you've done so, create new widgets, apply different visibility rules for each one of them, and make sure the rules are respected on your site.

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
