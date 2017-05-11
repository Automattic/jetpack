## 5.0

5.0 is still in progress; [keep an eye on the changelog to find out more!](https://github.com/Automattic/jetpack/pull/7116)

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
