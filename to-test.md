## 4.8

Jetpack 4.8 introduces a refreshed admin interface, a new WordPress.com Toolbar for your Jetpack site, and several other improvements.

### Admin Interface

We've redesigned Jetpack's Admin interface to make it easier to navigate the list of Jetpack options and create a unified experience with the WordPress.com dashboard.

To test this, go to the Jetpack menu in your dashboard, and navigate through Jetpack settings. You'll want to play with as many settings as possible:

- Try interacting with the menu before you connect your site to a WordPress.com account.
- Try accessing the menu from a different local account, that is not linked to WordPress.com.
- Try accessing the menu with different user roles.
- Access the menu from different browsers, and from your mobile device.
- Do the settings displayed under Jetpack > Settings match the options you used on your site until now?
- When making changes to any of the settings there, can you save those changes, and do the changes get applied to your site?
- Are there any options that seem confusing?
- Try clicking on links providing more information, and make sure none of the links are broken.
- Try navigating the new admin interface using only your keyboard.

We are interested in any feedback you have for us about this new interface! If you have any remarks, [let us know](https://jetpack.com/contact-support/beta-group/)!

### WordPress.com Toolbar

The WordPress.com toolbar replaces the default admin bar and offers quick links to the Reader, all your sites, your WordPress.com profile, and notifications. Centralize your WordPress experience with a single global toolbar.

To test this new feature, go to Jetpack > Settings, enable the WordPress.com Toolbar option, and check the toolbar appearing at the top of your site. You'll want to make sure all links are relevant to your account and your site, and work.

We would also recommend testing using different accounts on your site, and different roles.

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
