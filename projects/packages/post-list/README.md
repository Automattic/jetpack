# Jetpack Post List Package

Enhance the classic view of the Admin section of your WordPress site.

## How to Use

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-post-list).

Use composer to add the package to your project:
```bash
composer add automattic/jetpack-post-list
```

Then you need to initialize it on the `admin_init` hook:

```php
add_action( 'admin_init', array( '\Automattic\Jetpack\Post_List\Post_List', 'configure' ) );
```

## Development

### Production
```bash
jetpack build -p packages/post-list
```

### Development
```bash
jetpack build packages/post-list
```

### Development Watching Mode 👀
```bash
jetpack watch packages/post-list
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-post-list is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
