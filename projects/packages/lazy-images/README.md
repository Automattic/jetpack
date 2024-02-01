# Jetpack Lazy Images

Speed up your site and create a smoother viewing experience by loading images as visitors scroll down the screen, instead of all at once.

## Usage

```php
/*
 * Initialize lazy images on the wp action so that conditional
 * tags are safe to use.
 *
 * As an example, this is important if a theme wants to disable lazy images except
 * on single posts, pages, or attachments by short-circuiting lazy images when
 * is_singular() returns false.
 *
 * See: https://github.com/Automattic/jetpack/issues/8888
 */

add_action( 'wp', array( 'Automattic\\Jetpack\\Jetpack_Lazy_Images', 'instance' ) );
```

## Development

Running tests requires working `svn`, `composer` and `pnpm` commands.

Once these are installed, you install the composer dependencies by running:

```bash
$ composer install --ignore-platform-reqs
```

### Generate minified JavaScript

The JavaScript file can be minified from the root of the Jetpack repository:

```bash
$ cd ../../
$ pnpm build-packages
```

### Run PHP unit tests

On a local development environment run:
```bash
$ composer phpunit
```

### Lint PHP source code

The PHP code can be linted from the root of the Jetpack repository:
```bash
$ cd ../../
$ composer phpcs:compatibility packages/lazy-images
$ composer phpcs:lint packages/lazy-images
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-lazy-images is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
