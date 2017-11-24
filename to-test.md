## 5.6

### Protect

We've created a new setting one can use to change the default WordPress log in form, and add a new field with an option to send yourself an email with a link to log in when you got locked out of your site.

Follow the instructions below to test the feature:

1. Set the following constant in your `wp-config.php`: `define( 'JETPACK_ALWAYS_PROTECT_LOGIN', true );`
2. Now when you go to wp-login.php you will be asked to enter an email.
3. After receiving the email you should be able to login again or change your password.
4. The token that you get in the email is only valid for 15 minutes.

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
