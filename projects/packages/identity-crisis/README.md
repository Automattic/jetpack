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
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-identity-crisis is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
