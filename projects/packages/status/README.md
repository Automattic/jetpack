# Jetpack Status

A status class for Jetpack.

Used to retrieve information about the current status of Jetpack and the site overall.

### Usage

Find out whether the site is in offline mode:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_offline_mode = $status->is_offline_mode();
```

Find out whether this is a system with multiple networks:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_multi_network = $status->is_multi_network();
```

Find out whether this site is a single user site:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_single_user_site = $status->is_single_user_site();
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-status is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
