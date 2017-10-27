## 5.5

### Connection process

We made some changes to reduce the number of connection issues that may happen on a site when switching from HTTP to HTTPs. To test this, if your site uses HTTPs, make sure you can still interact with your site via WordPress.com (try publishing or editing posts for example), and check to see that things like Related Posts still work on your site.

We have also improved the connection process to make sure other plugins can't interfere with the connection. To test this, try the following:

1. Start with a disconnected site and user, and multiple other plugins active.
2. Visit the dashboard and confirm that the Connect button has an appropriate URL and that you can connect
3. After connecting, login in with a non-admin user and confirm that the banner button that reads "Connect to WordPress.com" works and has a good href.
4. Confirm that you can cycle the connection. Connect Jetpack, get back to the admin page. Disconnect, and try to connect again without refreshing the page.

### Carousel

We have made some performance improvements to the Carousel feature. It would be great if everyone could test every aspect of Carousel in this release:
- Does it work well on single images when the image is set to link to an attachment page?
- Does it work well with standard WordPress galleries?
- Does it work well with Tiled Galleries?
- Are you able to comment on a Carousel image, whether you are logged in or logged out of your WordPress account?

### Gallery Widget

The next version of WordPress will now include its own [Gallery Widget](https://make.wordpress.org/core/2017/09/25/introducing-the-gallery-widget/). We've added the option to choose a Tiled Gallery type in that new widget.

To test this, make sure you are running WordPress 4.9 Beta. You can use [this plugin](https://wordpress.org/plugins/wordpress-beta-tester/) to update WordPress on your site. Once you have done so you should see the new widget under Appearance > Widgets and Appearance > Customize. Try to use one the Tiled Gallery types when the Jetpack feature is active, and make sure it is displayed properly.

### Misc

- [Always] Try to connect with a brand new site, and also cycle your connections to existing sites.

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
