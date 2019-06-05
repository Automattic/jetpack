# Jetpack Constants

A simple constant manager for Jetpack.

Testing constants is hard. Once you define a constant in PHP, it's defined. Constants Manager is an abstraction layer so that unit tests can set constants for tests.

### Usage

Retrieve the value of a constant `CONSTANT_NAME` (returns `null` if it's not defined):

```php
use Automattic\Jetpack\Constants\Manager as Constants_Manager;

$constant_value = Constants_Manager::get_constant( 'CONSTANT_NAME' );
```

Set the value of a constant `CONSTANT_NAME` to a particular value:

```php
use Automattic\Jetpack\Constants\Manager as Constants_Manager;

$value = 'some value';
Constants_Manager::set_constant( 'CONSTANT_NAME', $value );
```

Check whether a constant `CONSTANT_NAME` is defined:

```php
use Automattic\Jetpack\Constants\Manager as Constants_Manager;

$defined = Constants_Manager::is_defined( 'CONSTANT_NAME' );
```

Check whether a constant `CONSTANT_NAME` is truthy:

```php
use Automattic\Jetpack\Constants\Manager as Constants_Manager;

$is_truthy = Constants_Manager::is_true( 'CONSTANT_NAME' );
```

Delete the `CONSTANT_NAME` constant:

```php
use Automattic\Jetpack\Constants\Manager as Constants_Manager;

Constants_Manager::clear_single_constant( 'CONSTANT_NAME' );
```

Delete all known constants:

```php
use Automattic\Jetpack\Constants\Manager as Constants_Manager;

Constants_Manager::clear_constants();
```
