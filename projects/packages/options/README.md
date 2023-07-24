# Jetpack Options

A static class for Jetpack's options.

Used as a wrapper for WordPress options, allowing folks
to add / update / delete options from the Jetpack namespace.

### Example Usage

Get a Jetpack option:

```php
Jetpack_Options::get_option( 'version' )
```

[Explore the code for Jetpack_Options](legacy/class-jetpack-options.php) to see a complete
list of documented methods. 

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-options is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
