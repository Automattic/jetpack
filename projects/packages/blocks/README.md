# Jetpack Blocks

Register and manage blocks within a plugin. Used to manage block registration, enqueues, and more.

## Usage

## Development

Running tests requires working `svn`, `composer` and `pnpm` commands.

Once these are installed, you install the composer dependencies by running:

```bash
$ composer install --ignore-platform-reqs
```

### Run PHP unit tests

On a local development environment run:
```bash
$ composer phpunit
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-blocks is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
