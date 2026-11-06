# monetize

The Monetize dashboard: payments, paid subscribers and ads in wp-admin.

The page is a `@wordpress/build` route in `routes/dashboard`, rendered under the `jetpack-monetize` menu slug. The Jetpack plugin loads it from its `monetize` module:

```php
\Automattic\Jetpack\Monetize\Dashboard::init();
```

On the WordPress.com platform, `init()` adds no sidebar item: jetpack-mu-wpcom owns Jetpack › Monetize there, and it still links to Calypso. A Simple host that wants this page calls `init()` to load the build, then `Dashboard::add_wp_admin_submenu()` from its own Jetpack menu builder, which runs late.

The dashboard is behind the `jetpack-monetize-dashboard` feature flag while it is built. Hosts register it with `Dashboard::register_feature_flag()` and check it with `Dashboard::is_enabled()`.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

monetize is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
