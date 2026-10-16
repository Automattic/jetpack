# protect

Shared Protect code for the Jetpack and Jetpack Protect plugins.

It provides the Protect dashboard, shared by the Jetpack plugin's `protect-dashboard` module and, later, the Jetpack Protect plugin. The page is a `@wordpress/build` route in `routes/dashboard`, rendered under the `jetpack-protect` menu slug:

```php
\Automattic\Jetpack\Protect\Dashboard::init();
```

It takes that slug over from the Jetpack Protect plugin, replacing the plugin's dashboard, so keep the Jetpack plugin's `jetpack-protect-dashboard` flag off on sites using that plugin until this page matches it.

Each feature of the page is a section: a class in `src/sections/class-<name>.php`, named `Sections\<Name>` (so `class-login-protection.php` declares `Sections\Login_Protection`), that implements `Dashboard_Section`. `Dashboard::init()` finds and registers them, so a section file must only declare its class. The matching UI is a slot in `routes/dashboard/sections/`.

For now the dashboard assumes the Jetpack plugin: `Dashboard::get_module_state()` reads Jetpack's modules, and the settings it reads and saves go through Jetpack's `jetpack/v4/settings` and `jetpack/v4/waf` endpoints. The Jetpack Protect plugin will need its own equivalents before it can use the page.

## How to install protect

### Installation From Git Repo

## Contribute

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

protect is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

