# Jetpack Asset Management

A package containing functionality to improve loading of assets (scripts, etc).

Includes manipulation of paths, enqueuing async scripts, and DNS resource hinting.

## Usage

* `::get_file_url_for_environment( $min_path, $non_min_path, $package_path )` -- This is similar to `plugins_url()`, but chooses between `$min_path` and `$non_min_path` based on the constant `SCRIPT_DEBUG`.
  The filter `jetpack_get_file_for_environment` may be used to control the returned URL.
* `::add_resource_hint( $urls, $type )` -- Adds domains (string or array) to the WordPress' resource hinting. Accepts type of dns-prefetch (default), preconnect, prefetch, or prerender.
* `::normalize_path( $path )` -- Normalize `.` and `..` components in a path or URL.
* `::register_script( $handle, $path, $relative_to, $options )` -- Register a Webpack bundled script and styles using data produced by `@wordpress/dependency-extraction-webpack-plugin`.
  This replaces reading the `.asset.php` file and then making calls to `wp_register_script()`, `wp_register_style()` (with a potentially varying filename based on `is_rtl()`), and `wp_set_script_translations()`. See the inline documentation for details.
* `::enqueue_script( $handle )` -- Enqueue a script and style previously registered with `::register_script()`.
* `::alias_textdomains_from_file( $file )` -- Use data recorded by [automattic/jetpack-composer-plugin](https://packagist.org/packages/automattic/jetpack-composer-plugin) to enable use of translations for shared Composer libraries.
* `::alias_textdomains( $from, $to, $totype, $ver )` -- Manually add a textdomain alias, if for some reason `::alias_textdomains_from_file()` is insufficient.

The Assets package also provides a `wp-jp-i18n-loader` script to support Webpack lazy-loaded bundles using [@automattic/i18n-loader-webpack-plugin](https://www.npmjs.com/package/@automattic/i18n-loader-webpack-plugin). No initialization is required, other than calling `::alias_textdomains_from_file()` or `::alias_textdomains()` if said bundles are coming from shared Composer libraries.

## Testing

```bash
$ composer run phpunit
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-assets is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

