# Blaze

Attract high-quality traffic to your site using Blaze. Using this service, you can advertise a post or page on some of the millions of pages across WordPress.com and Tumblr.

## How to install blaze

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-blaze).

Use composer to add the package to your project:
```bash
composer add automattic/jetpack-blaze
```

### Initializing the features

#### Using the Config Package

The JITMs can be enabled using the Config package:

```
use Automattic/Jetpack/Blaze;

add_action( 'plugins_loaded', 'configure_blaze', 1 );

function configure_blaze() {
    $config = new Config();
    $config->ensure( 'blaze' );
}
```

#### Hook it
Or can initialize it on the `admin_init` hook:

```php
add_action( 'admin_init', array( '\Automattic\Jetpack\Blaze', 'configure' ) );
```

#### Direct invocation
Or directly invoke with a method call: 
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


## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

blaze is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

