# Jetpack Identity Crisis

Identity Crisis

## Usage

To initialize Identity Crisis checks the following snippet is required.

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
