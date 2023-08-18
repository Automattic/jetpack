# boost-speed-score

A package that handles the API to generate the speed score. The `Speed_Score` class registers the API routes that are going to be used in the frontend.

## Get Started
Build and install the package:

```sh
jetpack build packages/boost-speed-score && jetpack install packages/boost-speed-score
```

From the plugin folder, require the package using composer:

```sh
composer require automattic/jetpack-boost-speed-score
```

Then use it:

```php
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score;

new Speed_Score( $modules, 'jetpack-dashboard' );
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

boost-speed-score is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

