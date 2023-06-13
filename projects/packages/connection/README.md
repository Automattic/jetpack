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

## Tools

1. [Making Authenticated async XML-RPC calls](docs/xmlrpc-async-calls.md)
1. [Customizing error messages](docs/error-handling.md)

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-connection is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
