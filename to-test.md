## 5.6

### Google Analytics

Jetpack Professional customers using the WooCommerce plugin and needing some in-depth Google Analytics reports will be happy with this release. We've added support for universal analytics to Jetpack in this release. To test this new feature, follow the instructions [in this PR](https://github.com/Automattic/jetpack/pull/8182).

### Lazy images

We've added a new module, Lazy Images, to improve page load times by only loading an image when it is visible in the viewport.

To test, try the following:

1. Go to `https://yoursite.com/wp-admin/admin.php?page=jetpack_modules` and enable the "Lazy Images" module.
2. Visit pages when you have inserted single images, galleries, slideshows. You'll want to test this on pages where the images are at the top of the page, but also on pages where you have to scroll to see the images. You will want to make sure that images get loaded as you scroll down the page, and that [no JavaScript error appears in your browser console](http://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors).
3. Try in as many browsers as possible.

### Photon

Until now, when filtering content, Photon removed `width` and `height` attributes from image tags. This was done to make sure images were never distorted, regardless of how they were inserted in a post.

We've now improved this process and avoid removing those attributes when we can. To test, try inserting images in test posts. Use multiple methods to insert your images: slideshows, galleries, custom (non Jetpack) galleries, single images, images hosted somewhere else. You will want to make sure no image gets distorted, and that the `width` and `height` attributes are there. Ensure that you're "viewing source" to check this as opposed to using your browser's dev tools.

### Protect

We've created a new setting one can use to change the default WordPress log in form, and add a new field with an option to send yourself an email with a link to log in when you got locked out of your site.

Follow the instructions below to test the feature:

1. Set the following constant in your `wp-config.php`: `define( 'JETPACK_ALWAYS_PROTECT_LOGIN', true );`
2. Now when you go to wp-login.php you will be asked to enter an email.
3. After receiving the email you should be able to login again or change your password.
4. The token that you get in the email is only valid for 15 minutes.

### Shortcodes

In this release we started using minified JavaScript files for all the shortcodes that rely on JavaScript in the plugin. You will consequently want to try testing the following shortcodes:
- Brightcove
- Gist
- Instagram
- Presentations
- Quizzes
- Recipes
- Slideshows

You can find instructions on how to use each shortcode [here](https://jetpack.com/support/shortcode-embeds/).

For each shortcode, you will want to make sure they work as expected, and that [no JavaScript error appears in your browser console](http://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors).

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
