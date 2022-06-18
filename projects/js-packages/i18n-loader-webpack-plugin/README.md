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
- `loaderModule`: The name of a module supplying the i18n loader. See [Loader module](#loader-module) below for details.
- `loaderMethod`: The name of the function from `loaderModule` to download the i18n. See [Loader module](#loader-module) below for details.
- `target`: The target of the build: 'plugin' (the default), 'theme', or 'core'. This is used to determine where in WordPress's languages directory to look for the translation files.
- `path`: See [Webpack context](#webpack-context) below for details.
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

### Loader module

In order to load the translations, the generated bundle needs to call a method to do the actual downloading at runtime. This is handled by loading a module that must be externalized by your Webpack configuration.

The default module name is `@wordpress/jp-i18n-loader`, which will automatically be externalized by [@wordpress/dependency-extraction-webpack-plugin], which will also register it as a dependency for "wp-jp-i18n-loader" in the generated `.asset.php` file. That, in turn, is provided by the [automattic/jetpack-assets] Composer package (which also provides an `Automattic\Jetpack\Assets::register_script()` function to easily consume the `.asset.php` file).

But if for some reason you don't want to use those packages, you can set the plugin's `loaderModule` and `loaderMethod` options to point to a different module name, use [Webpack's externals configuration] to externalize it, and appropriate PHP code to provide the corresponding global variable for your externals configuration to retrieve.

The loader method might be documented like this:
```js
/**
 * Download and register translations for a bundle.
 *
 * @param {string} path - Bundle path being fetched. May have a query part.
 * @param {string} domain - Text domain to register into.
 * @param {string} location - Location for the translation: 'plugin', 'theme', or 'core'.
 * @returns {Promise} Resolved when the translations are registered, or rejected with an `Error`.
 */
```
Most likely the method will separate any query part from the path, hash it, build the download url, fetch it, then register it via `@wordpress/i18n`'s `setLocaleData()` method.

### Webpack context

WordPress's translation infrastructure generates a file for each JS script named like "_textdomain_-_locale_-_hash_.json". The _hash_ is an MD5 hash of the path of the script file relative to the plugin's root.

I18n-loader-webpack-plugin assumes that [Webpack's context] is the base of the WordPress package or plugin in which the bundles will be included, and that the [loader module](#loader-module) will handle mapping from package root to plugin root.
If this is not the case, you'll need to set the plugin's `path` parameter to the relative path from the plugin's root to Webpack's `output.path`.

### Other useful Webpack configuration

If you're having Webpack minify your bundle, you'll likely also want to do the following:

* Be sure that you're not naming the output files with an extension `.min.js`, as that will cause the WordPress translation infrastructure to ignore them.
* Set `optimization.concatenateModules` to false, as that optimization can mangle the i18n method names.
* Configure Terser to not mangle `__`, `_n`, `_nx`, and `_x`.
* Use [@automattic/babel-plugin-preserve-i18n](https://www.npmjs.com/package/@automattic/babel-plugin-preserve-i18n) to help further preserve those method names.
* Configure Terser to preserve comments starting with "Translators" or "translators" in the output.
* Check your code to avoid [certain constructs](https://github.com/Automattic/jetpack/blob/trunk/projects/js-packages/i18n-check-webpack-plugin/README.md#known-problematic-code-patterns) that will dissociate translator comments from the i18n method calls when the minifier rearranges the code.

### Use in Composer packages

Composer packages are useful for holding shared code, but when it comes to WordPress plugin i18n there are some problems.

WordPress's plugin infrastructure doesn't natively support Composer packages, so the usual thing to do is to include the `vendor/` directory in the push to the WordPress.org SVN.
That won't work for packages needing translation, though, as WordPress's translation infrastructure ignores the `vendor/` directory when looking for strings to be translated.
You'll need to use something like [automattic/jetpack-composer-plugin] so that the composer packages with translated strings are installed to a different path.

Also, as the translation file will be named using the plugin's textdomain rather than the Composer package's, the consuming plugin will also need to arrange for the [loader module](#loader-module) to fetch the proper file.
This may be done using [automattic/jetpack-assets] along with [automattic/jetpack-composer-plugin], as described in the latter's documentation.

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
