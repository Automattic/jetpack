# my-plans-ui

Standalone My Plans page in wp-admin

## How to install

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-connection-ui).

1. Use composer to add the package to your project:
```bash
composer add automattic/jetpack-my-plans-ui
```

2. Then you need to initialize it on the `plugins_loaded` hook:
```php
add_action( 'plugins_loaded', 'load_my_plans_ui' );

function load_my_plans_ui() {
	Automattic\Jetpack\MyPlansUI\Admin::init();
}
```

3. You need to build its assets before using it.
To do that, you need to run the following commands:
```bash
cd vendor/automattic/jetpack-my-plans-ui
pnpm build
```

## Contribute

## Get Help

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

my-plans-ui is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

