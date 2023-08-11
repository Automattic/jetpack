# Jetpack Licensing

A Licensing Package that attaches Jetpack licenses.

## Usage

### Initialize to automatically attach licenses when:

- The `jetpack_licenses` option is updated.
- Jetpack is connected.

```php
use Automattic\Jetpack\Licensing;

Licensing::instance()->initialize();
```

### Attach an array of license keys.

```php
use Automattic\Jetpack\Licensing;

$licenses = array( 'license_key_1', 'license_key_2' );
$results  = Licensing::instance()->attach_licenses( $licenses );
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-licensing is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
