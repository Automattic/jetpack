# Jetpack WPAdminPlus Package

Enhance the classic view of the Admin section of your WordPress site.

## How to use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-wp-admin-plus).

1. Use composer to add the package to your project:
```bash
composer add automattic/jetpack-wp-admin-plus
```

2. Then you need to initialize it on the `plugins_loaded` hook:
```php
add_action( 'plugins_loaded', 'load_wpadminplus_ui' );

function load_wpadminplus_ui() {
	Automattic\Jetpack\WPAdminPlus\Admin::init();
}
```

3. You need to build its assets before using it.
To do that, you need to run the following commands:
```bash
cd vendor/automattic/jetpack-wp-admin-plus
pnpm build-all
```
## Development

```bash
jetpack build packages/wp-admin-plus
```

... watching changes 👀

```bash
jetpack watch packages/wp-admin-plus
```
