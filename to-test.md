## 4.3: a new interface with easier-to-manage settings and features.

With Jetpack 4.3, we completely revamped the admin interface. The new dashboard is faster, fully responsive, and offers you all the tools you need to monitor your site's health and performance.

We'd like to you to try and test every aspect of that new interface.

We're looking forward to getting your feedback on the following things:

### Check for errors

- JavaScript errors: [open your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and make sure that no errors happen when navigating the Jetpack Dashboard, under the Jetpack menu in your dashboard.
- Add the following to your site's `wp-config.php` file:

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

Once you've done so, check the `wp-content/debug.log` file for errors as soon as something doesn't seem to work as expected.
- When an error is displayed in the Jetpack dashboard (in one of those pill-shaped notices), let us know if the errors are understandable.

### Change Jetpack settings

The new interface allows you to activate and deactivate modules, as well as change their settings. **Activate and deactivate modules, change module settings.** Make sure that your changes are saved properly, and applied for each module.

### Monitor VaultPress and Akismet settings

Did you purchase [a Premium or a Professional plan](https://jetpack.com/features/)? Do you already use Akismet or VaultPress on your site? Make sure that all your settings are correct in the new Jetpack dashboard.

### Test in different environments

Try to manage your Jetpack settings in different browsers, with JavaScript enabled and disabled.

### Give us your opinion

Let us know if you experience issues, or get confused when navigating the dashboard, searching for options, discovering a module, changing its settings. If something feels wrong, or is more confusing than it should be, let us know! If you can't find a specific option, or if you're having trouble finding your way around the new navigation, let us know!

**Pro tip: use the "Disconnect Jetpack" link at the bottom of the Jetpack menu, and then use the "Reset Options" to start from scratch, as a brand new Jetpack user.**

You can send us all your feedback via [this form](https://jetpack.com/contact-support/beta-group/). Thank you, and happy testing! ☺️ 🚀
