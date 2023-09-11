# Blaze

Attract high-quality traffic to your site using Blaze. Using this service, you can advertise a post or page on some of the millions of pages across WordPress.com and Tumblr.

## How to install blaze

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-blaze).

Use composer to add the package to your project:
```bash
composer add automattic/jetpack-blaze
```

### Initializing the feature

#### Direct invocation
You can directly invoke the feature with a method call: 

```php
use Automattic\Jetpack\Blaze;
Blaze::init();
```

## Development

### Production
```bash
jetpack build -p packages/blaze
```

### Development
```bash
jetpack build packages/blaze
```

### Development Watching Mode 👀
```bash
jetpack watch packages/blaze
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

blaze is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

