## 4.9

4.9 is still in progress; [keep an eye on the changelog to find out more!](https://github.com/Automattic/jetpack/pull/6949)

### Widgets

This release introduces 3 new widgets:

#### Flickr

The Flickr widget will display pictures from your own Flickr account, or will display random interesting pictures from Flickr. To test it, go to Appearance > Customize > Widgets in your dashboard:

1. Add the widget to a sidebar and check if the widget shows up.
2. Check if the photos are retrieved from the correct RSS feed.

#### EU Cookie Law Banner

This new widget allows you to display a EU Cookie Law Banner on your site. To give the widget a try, go to Appearance > Customize > Widgets in your dashboard:

1. Add the widget to a sidebar and check if the banner shows up near the bottom of the window.
2. Check if, when closed with the selected method, it actually stays closed.
3. Check if both light and dark themes work appropriately.

#### Internet Defense League

This widget displays Internet Defense League campaigns and banners in your sidebar. To test it, go to Appearance > Customize > Widgets in your dashboard:

1. Add the widget to one of your sidebars, and change the options.
2. The widget options should work, regardless of the image type or visibility settings.

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
