# Jetpack Identity Crisis

Identity Crisis

## Usage

The Identity Crisis package can be initialized using the Config package as shown in the example below.

```php
use Automattic\Jetpack\Config;

// Configuring as early as plugins_loaded priority 1
// to make sure every action handler gets properly set.
add_action( 'plugins_loaded', 'configure_identity_crisis', 1 );

function configure_identity_crisis() {
    $config = new Config();
    $config->ensure( 'identity_crisis' );
}
```


The Identity Crisis package can also be initialized directly.

```php
// Initialize Identity Crisis.
add_action( 'plugins_loaded', array( 'Automattic\\Jetpack\\Identity_Crisis', 'init' ) );
```

## Examples

Clearing IDC options.
```php
namespace Automattic\Jetpack\Identity_Crisis;
Identity_Crisis::clear_all_idc_options();
```
