# composer-plugin

This is a custom installer plugin for Composer to help with WordPress translation of Composer libraries intended for use as shared code in plugins and themes.

When this plugin is installed, libraries with `type` set to `jetpack-library` will be installed into `jetpack_vendor/` instead of the usual `vendor/`.
Also translation text domain information will be collected from such libraries and written to `jetpack_vendor/i18n-map.php`.

## Use in a WordPress plugin or theme

This plugin needs to be put into the `require` section of your `composer.json` file in order to be used.

```json
	"require": {
		"automattic/jetpack-composer-plugin": "*"
	},
```

You'll also want to set `extra.wp-plugin-slug` or `extra.wp-theme-slug` to the WordPress.org slug, which is also the textdomain for your plugin or theme's translations.

```json
	"extra": {
		"wp-plugin-slug": "my-plugin"
	},
```

Finally, for the libraries' translations to work, you'll also want to require [automattic/jetpack-assets](https://packagist.org/packages/automattic/jetpack-assets)
and include something like the following in your initialization code just after you load the autoloader:
```php
\Automattic\Jetpack\Assets::alias_textdomains_from_file( __DIR__ . '/jetpack_vendor/i18n-map.php' );
```

## Use by a library

A library that wants to be used in WordPress plugins or themes needs to set the `type` in `composer.json` to `jetpack-library`. The library package _should not_ itself include a dependency on automattic/jetpack-composer-plugin, although it may [suggest](https://getcomposer.org/doc/04-schema.md#suggest) it.

All calls to `__()`, `_x()`, and other WordPress i18n functions should then use a textdomain unique to the library. This textdomain also needs to be declared in `composer.json` as `extra.textdomain`:
```json
	"extra": {
		"textdomain": "my-library"
	},
```

## License

composer-plugin is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

