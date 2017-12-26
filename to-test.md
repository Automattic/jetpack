## 5.7

### Portfolio

Portfolio posts are now revisioned.

Follow the instructions below to test the feature:

1. Create a new Portfolio entry, don't publish it.
2. Save the draft a few times.
3. Confirm you can see revisions, just as you would see for posts or pages.

### Markdown

There used to be a bug that didn't allow you to use markdown as content for a shortcode resulting in a weird hash/number being shown in the rendered content.

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

### Comments

#### Hooking on comments

Now, other plugins hooking on `comment_form_after` for showing content will work seamlessly with Jetpack.

To test:

1. Add a plugin that hooks in after the comment form, such as Webmentions ( https://wordpress.org/plugins/webmention/ ).
2. Visit any given post for which comments are enabled an expect to see the content that the other plugin outputs.

#### WordPress.com comments editor

Edit links for comments will be redirected to WordPress.com comment editor if the Jetpack option `edit_links_calypso_redirect` is enabled.

To test:

1. Ensure the option is enabled. One way is to run the following `wp` cli command:
	```sh
	wp jetpack options update edit_links_calypso_redirect 1
	```
2. Verify that the frontend Edit link for a comment points to WordPress.com.

### Search

We improved the UI for customizing the Search widget.

To test the new customization UI for the widget:

1. Start with a site that has Jetpack Professional Plan associated (nothing about search should show up otherwise).
2. Turn on search from the Jetpack dashboard or from the Jetpack Traffic Settings page.
3. Go customize your widgets (either in wp-admin or the customizer)
4. Add the Jetpack Search widget and customize it. Things to try customizing:
	* Add filtering by category/tags/custom-taxonomy
	* Add filtering by post type
	* Add filtering by date
	* Use the widget search box, or a search box in the theme or in the Core search widget
	* Try different themes. This is an interesting list: https://www.godaddy.com/garage/wordpress-hot-100/ Try to test with some themes that were not tested previously in https://github.com/Automattic/jetpack/pull/8412
	* Try customizing search on a WooCommerce site.

The goal with all of the above is to enable a non-technical user to configure and customize search.

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
