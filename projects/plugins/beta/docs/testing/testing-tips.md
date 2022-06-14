## Get a testing site

To test out Jetpack, we recommend setting up a publicly accessible test site. Testing locally is limited and isn’t particularly helpful, as most Jetpack features rely on a connection to WordPress.com. You can create a test site from scratch or use a staging environment based on your production site.

**Please only install the Beta plugin on a test site. By their nature, Beta releases could be unstable and should not be used on a site where your data is important.**

#### Jetpack Live branches

**Jetpack Live Branches** is a [Tampermonkey](https://tampermonkey.net/) script that allows us to launch WordPress Sites with a Jetpack version coming from a changeset present on a Pull Request. This is achieved by installing the [Jetpack Beta Tester plugin](https://github.com/Automattic/jetpack-beta) on a fresh new WordPress site and switching to the branch matching the Pull Request.

More details on how to use in the [Jetpack Live Branches README](https://github.com/Automattic/jetpack/blob/trunk/tools/jetpack-live-branches/README.md#readme).

## Check for JavaScript errors and enable Debug

During your tests, we encourage you to open your browser's Development Tools and keep the Console open, checking for any errors in the Console and the Network tabs.

To open the Console in Chrome or Firefox, you can press CMD+Alt+i in macOS or F12 in Windows. You can find out more [here](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/).

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

Your `wp-config.php` file may already include a line that says `define('WP_DEBUG', false);`. You can remove it, and replace it by the code above.
