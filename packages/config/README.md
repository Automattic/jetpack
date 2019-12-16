# Jetpack Configuration

Allows for enabling and initializing of Jetpack features provided by
other packages.

# Usage

Add this package as a dependency to your project:

```
composer require automattic/jetpack-config
```

Add every other package you're planning to configure:

```
composer require automattic/jetpack-sync
composer require automattic/jetpack-tracking
composer require automattic/jetpack-terms-of-service
```

In your code initialize the configuration package at or before
plugins_loaded priority 9:

```
use Automattic/Jetpack/Config;

// Configuring Jetpack as early as plugins_loaded priority 1
// to make sure every action handler gets properly set.
add_action( 'plugins_loaded', 'configure_jetpack', 1 );

function configure_jetpack() {
    $config = new Config();

    foreach (
        array(
            'sync',
            'sync_woocommerce',
            'sync_wp_super_cache',
            'tracking',
            'tos',
        )
        as $feature
    ) {
        $config->ensure( $feature );
    }
}
```
