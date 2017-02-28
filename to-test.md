## 4.7

In Jetpack 4.7, we focused on fixing bugs and making some important performance improvements.

### Carousel

The Carousel module now allows you to display additional metadata in the meta box appearing below the pictures in the Carousel. To test this new feature, you can [check the instructions here](https://github.com/Automattic/jetpack/pull/6352).

### Infinite Scroll

We made multiple changes to the Infinite Scroll module in this release. To test, try the following:

- Scroll until no more items can be loaded via Infinite Scroll on your home page, and on archive pages such as tag pages. The footer should then be displayed properly.
- Switch to the Twenty Seventeen theme, and make sure you can use Infinite Scroll.

### Related Posts

In the last release we've added a new "Related Posts" panel to the customizer (under **Appearance > Customize > Related Posts**). It's also possible to change options from **Jetpack > Settings**, **Settings > Reading**, and from WordPress.com (under **[Settings > General](https://wordpress.com/settings/general/)**).

Please try to make changes to Related Posts options in all 4 interfaces, and make sure the Related Posts are always properly displayed, unless explicitly disabled.

### Sharing

This Beta includes some changes to the Email Sharing button. Try to add the button to a test site, and make sure you can share posts via email.

You can also try to install and activate [this plugin](https://wordpress.org/plugins/jetpack-shortlinks-for-sharing-buttons/), and make sure it doesn't break the Email sharing button.

We also fixed an issue with custom Sharing buttons. To test, go to **Settings > Sharing** and [follow the instructions here](https://jetpack.com/support/sharing/#custom) to create a custom sharing button. You can find some custom sharing service examples [here](https://ryanmarkel.com/3004/adding-specific-sharing-services-to-sharedaddy-or-jetpack/). Once you save your changes, make sure the buttons are displayed on your site.

### Shortcodes

Do you use [the Recipe shortcode](https://en.support.wordpress.com/recipes/)? You'll want to make sure the Print link works well in all browsers.

We've also fixed a conflict with embeds of WordPress posts. To test this, try the following:

1. Enable Jetpack's Shortcode Embeds module under Jetpack > Settings > Writing.
2. Go to Posts > Add New, and paste the URL of a post published on another WordPress site on its own line.
3. The URL should be converted into an embedded post preview in the Visual editor, as well as in your post when you publish it.

### Widget Visibility

We've made a lot of improvements to the Widget Visibility module. It's now easier and faster to manage visibility rules in your Widget settings.

We would like you to run tests on sites where you had created visibility rules in the past. Update to Jetpack 4.7 Beta, and make sure the rules still exist.
Once you've done so, create new widgets, apply different visibility rules for each one of them, and make sure the rules are respected on your site. Make sure to test rules on Tag and Category Archive Pages as well.

We also replaced text labels ("Add" and "Delete") with `×` and `+` icons. Please test these new labels in as many browsers as possible.

You can also test the new option to match all conditions specified for a widget. It allows you to specify multiple rules that all have to be met for the widget to be shown or hidden.

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
