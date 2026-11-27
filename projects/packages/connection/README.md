# Jetpack Connection Package

Let's talk to wordpress.com! 

## Get Started 

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-connection). We recommend using the latest version there, or you can also test with the latest development versions like below:

```
"require": {
    "automattic/jetpack-autoloader": "dev-trunk",
    "automattic/jetpack-config": "dev-trunk",
    "automattic/jetpack-connection": "dev-trunk"
}
```

## Guides
* [Connection package guide](docs/register-site.md)
* [Authorizing a user](docs/authorize-user.md)
* [Connection health tests](docs/connection-health-tests.md)
* [Connectors screen card](docs/connectors.md)
* [Connection Abilities (Abilities API)](docs/abilities.md)

## Tools

1. [Making Authenticated async XML-RPC calls](docs/xmlrpc-async-calls.md)
1. [Customizing error messages](docs/error-handling.md)
1. [Partner tools](docs/partner-tools.md)

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Safe Mode authorization source

A consumer can set an optional `from` value in its `identity_crisis` configuration
to identify itself when the merchant creates a separate connection:

```php
$config->ensure( 'identity_crisis', array(
    'slug'       => 'my-plugin',
    'admin_page' => '/wp-admin/admin.php?page=my-plugin',
    'from'       => 'my_plugin_safe_mode',
) );
```

The consumer's source is passed to registration and authorization when its
`admin_page` matches the current request, or when it is the only registered
consumer. With multiple consumers and no matching page, both screens keep their
default source, even if priority selects a consumer for the notice's branding.
Use a distinct Safe Mode source in the standard `owner_surface[_detail]` format
to keep recovery connections separate from normal connections in reports. See
[Adding a connect button](../../js-packages/connection/README.md#adding-a-connect-button)
for source naming guidance. Reuse an existing source only when WordPress.com
requires that exact value to select the consumer's branded flow. In that case,
registration and authorization counts share that source with normal connections;
the screen's recovery events still distinguish the Safe Mode action.
Consumers that omit it keep the default source for the selected Safe Mode screen.
This setting does not change permissions, recovery choices, or return destinations.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-connection is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
