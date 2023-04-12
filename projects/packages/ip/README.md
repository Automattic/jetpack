# Jetpack IP Package

Utilities for working with IP addresses.

## Usage

```php
use Automattic\Jetpack\IP\Utils;

echo "Your IP address is: " . Utils::get_ip();
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

IP is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

