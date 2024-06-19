# protect-models

This package contains the models used in Protect. 

## Get Started
Build and install the package:

```sh
jetpack build packages/protect-models && jetpack install packages/protect-models
```

From the plugin folder, require the package using composer:

```sh
composer require automattic/jetpack-protect-models
```

Then use it: (Example)

```php
use Automattic\Jetpack\Protect_Models\Status_Model;

$empty_status = new Status_Model();
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

protect-models is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

