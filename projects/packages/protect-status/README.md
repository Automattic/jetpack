# protect-status

This package contains the Protect Status API functionality to retrieve a site's scan status (WordPress, Themes, and Plugins threats).

## Get Started
Build and install the package:

```sh
jetpack build packages/protect-status && jetpack install packages/protect-status
```

From the plugin folder, require the package using composer:

```sh
composer require automattic/jetpack-protect-status
```

Then use it: (Example)

```php
use Automattic\Jetpack\Protect_Status\Status;

$protect_status = Status::get_status();

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

protect-status is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

