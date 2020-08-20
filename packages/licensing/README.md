# Jetpack Licensing

A Licensing Package that validates Jetpack licenses.

### Usage

Initialize to automatically validate licenses when:
- The `jetpack_licenses` option is updated.
- Jetpack is connected.

```php
use Automattic\Jetpack\Licensing\Manager as Licensing_Manager;

Licensing_Manager::instance()->initialize();
```

Validate an array of license keys.

```php
use Automattic\Jetpack\Licensing\Manager as Licensing_Manager;

$licenses = array( 'license_key_1', 'license_key_2' );
$results  = Licensing_Manager::instance()->validate_licenses( $licenses );
```
