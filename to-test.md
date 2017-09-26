## 5.4

### Shortcodes

We've made some improvements and fixed some bugs with the Facebook shortcode in this release. Try embedding different Facebook posts, images, and more in some of your posts. You will want to make sure the posts are as wide as your theme's content width. Here are a few examples of things you could embed: `https://www.facebook.com/jetpackme/photos/a.1078536988894553.1073741827.103336516414610/1078537925561126/?type=3&theater`
`https://www.facebook.com/jetpackme/posts/1505539472860967`
`https://www.facebook.com/RocketsAreCool/videos/1109290809200449/?permPage=1`



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
