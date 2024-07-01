# [Deprecated] Jetpack A/B Test

**IMPORTANT NOTICE:**

**This package is no longer maintained and currently broken. We do not recommend using it in any new projects.**

---

Provides an interface to the WP.com A/B tests.

Used to retrieve the variation of a valid, active A/B test running on WP.com for the current user.

### Usage

Retrieve the A/B test variation of the current user for the `example_abtest_name` A/B test:

```php
use Automattic\Jetpack\Abtest;

$abtest = new Abtest();
$variation = $abtest->get_variation( 'example_abtest_name' );
```

Will return `null` if the A/B test is invalid or is currently inactive.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-abtest is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
