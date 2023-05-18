# Jetpack Constants

A simple constant manager for Jetpack.

Testing constants is hard. Once you define a constant in PHP, it's defined. Constants Manager is an abstraction layer so that unit tests can set constants for tests.

### Usage

Retrieve the value of a constant `CONSTANT_NAME` (returns `null` if it's not defined):

```php
use Automattic\Jetpack\Constants;

$constant_value = Constants::get_constant( 'CONSTANT_NAME' );
```

Set the value of a constant `CONSTANT_NAME` to a particular value:

```php
use Automattic\Jetpack\Constants;

$value = 'some value';
Constants::set_constant( 'CONSTANT_NAME', $value );
```

Check whether a constant `CONSTANT_NAME` is defined:

```php
use Automattic\Jetpack\Constants;

$defined = Constants::is_defined( 'CONSTANT_NAME' );
```

Check whether a constant `CONSTANT_NAME` is truthy:

```php
use Automattic\Jetpack\Constants;

$is_truthy = Constants::is_true( 'CONSTANT_NAME' );
```

Delete the `CONSTANT_NAME` constant:

```php
use Automattic\Jetpack\Constants;

Constants::clear_single_constant( 'CONSTANT_NAME' );
```

Delete all known constants:

```php
use Automattic\Jetpack\Constants;

Constants::clear_constants();
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-constants is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
