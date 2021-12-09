# i18n-loader-webpack-plugin

A Webpack plugin to load WordPress translation data for [@wordpress/i18n] when Webpack lazy-loads a bundle.

## Installation

Generally you'll install this via your package manager, e.g.

```
npm install --save-dev @automattic/i18n-loader-webpack-plugin
```

## Usage

### Basic usage

This goes in the `plugins` section of your Webpack config, e.g.
```js
{
	plugins: [
		new I18nLoaderWebpackPlugin( {
			textdomain: 'mydomain',
		} ),
	],
};
```

Parameters recognized by the plugin are:

- `textdomain`: The text domain used in the JavaScript code. This is required, unless nothing in your JS actually uses [@wordpress/i18n].
- `stateModule`: The name of a module supplying the i18n state. See [State module](#state-module) below for details.
- `target`: The target of the build: 'plugin' (the default), 'theme', or 'core'. This is used to determine where in WordPress's languages directory to look for the translation files.
- `path`: See [Webpack context](#webpack-context) and [Use in Composer packages](#use-in-composer-packages) below for details.
- `ignoreModules`: If some bundles in your build depend on [@wordpress/i18n] for purposes other than translating strings, i18n-loader-webpack-plugin will none the less count them as "using @wordpress/i18n" which may result in it trying to load translations for bundles that do not need it. This option may be used to ignore the relevant source files when examining the bundles.

  The value may be a function, which will be passed the file path relative to [Webpack's context] and the Webpack Module object and which should return true if the file should be ignored, or a string or RegExp to be compared with the relative file path, or an array of such strings, RegExps, and/or functions.

### Use of [@wordpress/i18n]

For best results, each JavaScript file translating strings should import @wordpress/i18n directly to access `__()` and similar methods.
The use of @wordpress/i18n in the lazy bundle may not be detected if `__()` is imported indirectly or used by accessing the global `wp.i18n`.

Of course, you don't actually want @wordpress/i18n included in the bundle. The recommended way to handle this is to use [@wordpress/dependency-extraction-webpack-plugin] in your Webpack configuration.
But if for some reason you want to do it manually, something like this in your Webpack config should work:
```js
{
	externals: {
		'@wordpress/i18n': [ 'window wp', 'i18n' ],
	}
}
```

### State module

In order to load the translations, the generated bundle needs to be provided with some state at runtime. This is handled by loading a module that must be externalized by your Webpack configuration.

The default module name is `@wordpress/jp-i18n-state`, which will automatically be externalized by [@wordpress/dependency-extraction-webpack-plugin], which will also register it as a dependency for "wp-jp-i18n-state" in the generated `.asset.php` file. That, in turn, is provided by the [automattic/jetpack-assets] Composer package (which also provides an `Automattic\Jetpack\Assets::register_script()` function to easily consume the `.asset.php` file).

But if for some reason you don't want to use those packages, you can set the plugin's `stateModule` option to point to a different module name, use [Webpack's externals configuration] to externalize it, and appropriate PHP code to provide the corresponding global variable for your externals configuration to retrieve. The state is a JavaScript object with the following properties:

- `baseUrl`: The base URL from which to fetch the translations, probably something like `https://yoursite.example.com/wp-content/languages/`. The trailing slash is required.
- `locale`: The locale used on the page.
- `domainMap`: An object mapping textdomains. See [Use in Composer packages](#use-in-composer-packages) below for details.

### Webpack context

WordPress's translation infrastructure generates a file for each JS script named like "_textdomain_-_locale_-_hash_.json". The _hash_ is an MD5 hash of the path of the script file relative to the plugin's root.

I18n-loader-webpack-plugin assumes that [Webpack's context] is the base of the WordPress plugin in which the bundles will be included.
If this is not the case, you'll need to set the plugin's `path` parameter to the relative path from the plugin's root to Webpack's `output.path`.

### Other useful Webpack configuration

If you're having Webpack minify your bundle, you'll likely also want to do the following:

* Be sure that you're not naming the output files with an extension `.min.js`, as that will cause the WordPress translation infrastructure to ignore them.
* Set `optimization.concatenateModules` to false, as that optimization can mangle the i18n method names.
* Configure Terser to not mangle `__`, `_n`, `_nx`, and `_x`.
* Use [@automattic/babel-plugin-preserve-i18n](https://www.npmjs.com/package/@automattic/babel-plugin-preserve-i18n) to help further preserve those method names.
* Configure Terser to preserve comments starting with "Translators" or "translators" in the output.
* Check your code to avoid [certain constructs](https://github.com/Automattic/jetpack/tree/master/projects/js-packages/webpack-config#minification-and-i18n-translator-comments) that will dissociate translator comments from the i18n method calls when the minifier rearranges the code.

### Use in Composer packages

Composer packages are useful for holding shared code, but when it comes to WordPress plugin i18n there are some problems.

WordPress's plugin infrastructure doesn't natively support Composer packages, so the usual thing to do is to include the `vendor/` directory in the push to the WordPress.org SVN.
That won't work for packages needing translation, though, as WordPress's translation infrastructure ignores the `vendor/` directory when looking for strings to be translated.
You'll need to use something like [automattic/jetpack-composer-plugin] so that the composer packages with translated strings are installed to a different path.

Then, for Webpack builds in the Composer package, you'll need to set i18n-loader-webpack-plugin's `path` option to the path relative to the _plugin's_ root directory. For example, if your Composer package is named "automattic/foobar", will be used with [automattic/jetpack-composer-plugin] which will install the package to `jetpack_vendor/` rather than `vendor/`, and Webpack is building to a `build/` directory within the package, you'd need to set `path` to `jetpack_vendor/automattic/foobar/build/` as that's where the built files will end up relative to the plugin.

The consuming plugin will also need to arrange for the [state module](#state-module)'s `domainMap` to include a mapping from your Composer package's textdomain to the plugin's textdomain (prefixed with "plugins/"), as that's where the translations will end up.
<!-- @todo: Mention how to do that with automattic/jetpack-assets once we finish https://github.com/Automattic/jetpack/issues/21690. -->

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

i18n-loader-webpack-plugin is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

[@wordpress/i18n]: https://www.npmjs.com/package/@wordpress/i18n
[@wordpress/dependency-extraction-webpack-plugin]: https://www.npmjs.com/package/@wordpress/dependency-extraction-webpack-plugin
[automattic/jetpack-assets]: https://packagist.org/packages/automattic/jetpack-assets
[automattic/jetpack-composer-plugin]: https://packagist.org/packages/automattic/jetpack-composer-plugin
[Webpack's context]: https://webpack.js.org/configuration/entry-context/#context
[Webpack's externals configuration]: https://webpack.js.org/configuration/externals/
