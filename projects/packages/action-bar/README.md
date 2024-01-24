# Jetpack Action Bar

An easy way for visitors to follow, like, and comment on your site.

**Note**

This package is not actively maintained, and is not currently used in any Jetpack plugin.

## How to install jetpack-action-bar

You can start using the package and initiate the Action bar like so:

```php
use Automattic\Jetpack\Action_Bar;

( new Action_Bar() )->init();
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-action-bar is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
