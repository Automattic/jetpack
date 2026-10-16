# monitor

Downtime monitoring for Jetpack-connected sites. WordPress.com checks a site every five minutes while its `monitor` module is on; this package keeps each user's email alerts in step with WordPress.com.

Call `\Automattic\Jetpack\Monitor\Monitor::init()` early. It makes `monitor` a module a standalone plugin can switch on, subscribes whoever turns it on to the alerts, and forgets saved choices when a user unlinks or the site disconnects.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

monitor is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

