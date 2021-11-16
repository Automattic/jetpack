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
