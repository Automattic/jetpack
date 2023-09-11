# my-jetpack

WP Admin page with information and configuration shared among all Jetpack stand-alone plugins

## Usage

Every Jetpack plugin must include the My Jetpack package.

Require this package and initialize it:

```PHP
add_action( 'init', function() {
	Automattic\Jetpack\My_Jetpack\Initializer::init();
} );
```

### Conditionally loading licensing UI behind a feature flag

To disable the licensing UI at `/wp-admin/admin.php?page=my-jetpack#/add-license`, add a filter on `jetpack_my_jetpack_should_enable_add_license_screen` and return false: `add_filter( 'jetpack_my_jetpack_should_enable_add_license_screen', '__return_false' );`

That's all!

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

my-jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

