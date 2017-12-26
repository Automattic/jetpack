## 5.7

### Portfolio

Portfolio posts are now revisioned.

Follow the instructions below to test the feature:

1. Create a new Portfolio entry, don't publish it.
2. Save the draft few times.
3. Confirm you can see revisions, just as you would see for posts or pages.

### Markdown

There used to be a bug by which you wouldn't be able to use markdown as content for a shortcode resulting in a weird hash/number being shown in the rendered content.

To test, try the following:

1. Register a test shortcode. The callback doesn't matter (it just needs to be registered so it gets added to the regex).
	```php
	add_shortcode( 'test', '__return_empty_string' );
	```
2. Create a post with the following content:
	```
		[test]Text with `code` in it.[/test]
	```
3. Save the post, and visit it expecting to see the markdown converted to html.

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
