# protect

Shared Protect code for the Jetpack and Jetpack Protect plugins.

It provides the Protect dashboard, shared by the Jetpack plugin's `protect-dashboard` module and the Jetpack Protect plugin. The page is a `@wordpress/build` route in `routes/dashboard`, rendered under the `jetpack-protect` menu slug:

```php
\Automattic\Jetpack\Protect\Dashboard::init();
```

Only one plugin should call it: the Jetpack plugin skips its `protect-dashboard` module while the Jetpack Protect plugin is active, so the site shows one Protect menu item.

Each feature of the page is a section: a class in `src/sections/class-<name>.php`, named `Sections\<Name>` (so `class-login-protection.php` declares `Sections\Login_Protection`), that implements `Dashboard_Section`. `Dashboard::init()` finds and registers them, so a section file must only declare its class. The matching UI is a slot in `routes/dashboard/sections/`.

The page reads and saves its settings through the package's own `jetpack/v4/protect-dashboard/settings` route (`Settings`) and the WAF package's `jetpack/v4/waf`, so it works without the Jetpack plugin.

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

