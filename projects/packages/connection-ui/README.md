# Jetpack Connection UI Package

Convenient UI to manager your site's connection to WP.com 

## How to use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-connection-ui).

1. Use composer to add the package to your project:
```bash
composer add automattic/jetpack-connection-ui
```

2. Then you need to initialize it on the `plugins_loaded` hook:
```php
add_action( 'plugins_loaded', 'load_connection_ui' );

function load_connection_ui() {
	Automattic\Jetpack\ConnectionUI\Admin::init();
}
```

3. You need to build its assets before using it.
To do that, you need to run the following commands:
```bash
cd vendor/automattic/jetpack-connection-ui
pnpm build
```
