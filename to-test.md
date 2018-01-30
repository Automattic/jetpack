## 5.8

### Search

Jetpack's [Search feature](https://jetpack.com/support/search/) is now out of Beta! We've made quite a few improvements to the feature in Jetpack 5.8, and we will need your help to test it all.

**The features are only available to sites using a Jetpack Professional Plan, so you will want to make sure you don't see the features on sites that do not use that plan, or that were downgraded.**

#### Search Widget

To start testing (on a site using Jetpack Professional), drag the Jetpack's Search Widget into one of your widget areas, and interact with its options.
- The Widget options should work and get saved whether you are using the Customizer to interact with your widgets or the old Appearance > Widgets menu.
- There should be no JavaScript errors or PHP notices when loading the widget or making changes to it.
- The number of filters should always be set to 5 by default.
- Filtering should work as expected: do not hesitate to play with all Filtering options.
- You should be able to rearrange filters by dragging and dropping.
- When adjusting filters in the customizer, the preview should still work.
- If possible, test the widget on a site with multiple post types. WooCommerce sites make good test sites for example.
- Make sure the Help links are working.
- The widget should never display private data, such as private post types or taxonomies.

#### Search Results

- When using the Search Widget to exclude or include a specific Post Type in search results, make sure that works.
- Sorting results should work as expected.
- You should be able to adjust filters when looking at the search results page.
- Make sure the filters interface works and looks good with your theme. It should look similar to your other widgets.
- Make sure the results are relevant :)

### Lazy images

Jetpack 5.8 introduces a new module, Lazy Images. This feature, once activated under Jetpack > Settings, improves performance by loading images just before they scroll into view, and not before. To test it, activate the feature and make sure that all your images are still displayed properly, regardless of how they were inserted into your posts or pages.
You will also want to make sure the feature does not get activated by default when you update.

### Publicize / Subscriptions

We've made some changes to the way post status was synchronized with WordPress.com in this release. You will want to make sure Publicize and Subscriptions still work properly:
1. Try scheduling posts and see if they get sent to subscribers.
2. Try unpublishing a post that's already been publicized, and then publish it again; it should not be sent to subscribers.
3. Try publishing posts from a third-party app like [Stackedit](https://stackedit.io/editor).
4. Try bulk-editing posts in your editor, and make sure no posts get sent to subscribers by mistake.

### WordPress.com

We've made some changes to the way plugins can be installed via Jetpack. To test this, head over to [WordPress.com/plugins](https://wordpress.com/plugins) and try the following:
1. Install a new plugin by clicking on [Upload Plugin](https://wordpress.com/plugins/upload).
2. Install a new theme by going to [Upload Theme](https://wordpress.com/themes/upload).
3. Update plugins and themes.

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
