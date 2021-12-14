# Jetpack Webpack Config

This is a library of pieces for webpack config in Jetpack projects. It doesn't provide a usable webpack config on its own.

## Usage

In a webpack.config.js, you might do something like this.
```js
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const path = require( 'path' );

modules.exports = {
	entry: {
		// ... your entry points...
	},
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( __dirname, 'build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	plugins: [
		...jetpackWebpackConfig.StandardPlugins(),
	],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript.
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-' ],
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule(),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};
```

In a babel.config.js, you might do something like this.
```js
module.exports = {
	presets: [
		[ '@automattic/jetpack-webpack-config/babel/preset', { /* options */ } ],
	],
};
```

## Available "pieces"

`@automattic/jetpack-webpack-config` returns an object with two members, `webpackConfig` and `babelConfig`. You may also access these by requiring `@automattic/jetpack-webpack-config/webpack` and `@automattic/jetpack-webpack-config/babel` directly.

### Webpack

#### `webpack`

The Webpack instance used when creating the plugins and rules is supplied here, in case you have use for it.

#### `isProduction`, `isDevelopment`, `mode`

`isProduction` and `isDevelopment` are booleans indicating whether we're running in production or development mode. One will be true, the other false. You can use these if you want to vary your own configuration based on the model.

`mode` is a string, "production" or "development", matching the mode. This is intended for use as the Webpack `mode`.

The default is development mode; set `NODE_ENV=production` in node's environment to use production mode.

#### `devtool`

Webpack has several different devtools with various tradeoffs. This value selects an appropriate devtool for the mode.

In development mode, we choose 'eval-cheap-module-source-map'. This provides correct line numbers and filenames for error messages, while still being reasonably fast to build.

In production mode we choose no devtool, mainly because we don't currently distribute source maps in production.

#### `output`

This is an object suited for spreading some default values into Webpack's `output` configuration object. We currently set two of the settings:

- `filename`: `[name].js`.
- `chunkFilename`: `[name].js?minify=false&ver=[contenthash]`. The content hash serves as a cache buster, while `minify=false` avoids a broken minifier in the WordPress.com environment.

#### `optimization`

`optimization` is an object suitable for spreading some defaults into Webpack's `optimization` setting. It sets `minimize` based on the mode, configures a default `minimizer` with `TerserPlugin` and `CssMinimizerPlugin`, and sets `concatenateModules` to false as that setting [may mangle WordPress's i18n function names](https://github.com/Automattic/jetpack/issues/21204).

#### `TerserPlugin( options )`

This provides an instance of [terser-webpack-plugin](https://www.npmjs.com/package/terser-webpack-plugin) configured to preserve WordPress i18n methods and translator comments. Options are passed to the plugin.

The non-default options include:

- `terserOptions.ecma`, `terserOptions.safari10`, and `terserOptions.ie8` are set based on the browserslist config if available, otherwise based on [@wordpress/browserslist-config](https://www.npmjs.com/package/@wordpress/browserslist-config).
- `terserOptions.mangle.reserved` is set to preserve the `wp-i18n` methods.
- `terserOptions.format.comments` is set to preserve "translators" comments.
- `extractComments` is set to extract the comments normally preserved by terser to a LICENSE.txt file.

The options used may be accessed as `TerserPlugin.defaultOptions`. The filter functions used for comments may be accessed as `TerserPlugin.isTranslatorsComment()` and `TerserPlugin.isSomeComments()`. If you want to actually use these to override the default configuration, you may want to look at the hack used in the default configuration to get it to work with terser-webpack-plugin's parallel processing (or disable `parallel`).

#### `CssMinimizerPlugin( options )`

This provides an instance of [css-minimizer-webpack-plugin](https://www.npmjs.com/package/css-minimizer-webpack-plugin). Options are passed to the plugin.

#### `resolve`

This is an object suitable for spreading some defaults into Webpack's `resolve` setting.

Currently we only set `extensions` to add `.jsx`, `.ts`, and `.tsx` to Webpack's defaults.

#### Plugins

Note all plugins are provided as factory functions returning an array of Webpack plugins for consistency.

##### `StandardPlugins( options )`

This provides all of the plugins listed below. The `options` object can be used to exclude the plugin (by setting false) or amend its configuration (by setting an object). For example, to exclude DuplicatePackageCheckerPlugin and set an option for DependencyExtractionPlugin, you might do
```js
plugins: {
	...StandardPlugins( {
		DuplicatePackageCheckerPlugin: false,
		DependencyExtractionPlugin: { injectPolyfill: true },
	} ),
}
```

Note that I18nCheckPlugin is only included by default in production mode.

##### `DefinePlugin( defines )`

This provides an instance of Webpack's `DefinePlugin`, configured by default with the following defines:

- `process.env.FORCE_REDUCED_MOTION` to "false".
- `global` to "window".

You can pass any additional defines as the `defines` parameter. Note it is not necessary or desirable to define `process.env.NODE_ENV`, as Webpack will do that for you based on `mode`.

##### `MomentLocaleIgnorePlugin()`

This provides an instance of Webpack's `IgnorePlugin` configured to ignore moment.js locale modules.

##### `MiniCssExtractPlugin( options )`

This provides an instance of [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin). The `options` are passed to the plugin.

##### `MiniCssWithRtlPlugin( options )`

This is a plugin that adjusts `MiniCssExtractPlugin`'s asset loading to conditionally use RTL CSS as generated by `WebpackRtlPlugin`. You'll likely want to use both those plugins along with it.

Options are:
- `isRtlExpr`: String holding an expression that evaluates to a boolean, true if RTL CSS should be used. Default is `"document.dir === 'rtl'"`.

##### `WebpackRtlPlugin( options )`

This provides an instance of [@automattic/webpack-rtl-plugin](https://www.npmjs.com/package/@automattic/webpack-rtl-plugin). The `options` are passed to the plugin.

##### `DuplicatePackageCheckerPlugin( options )`

This provides an instance of [duplicate-package-checker-webpack-plugin](https://www.npmjs.com/package/duplicate-package-checker-webpack-plugin). The `options` are passed to the plugin.

##### `DependencyExtractionPlugin( options )`

This provides an instance of [@wordpress/dependency-extraction-webpack-plugin](https://www.npmjs.com/package/@wordpress/dependency-extraction-webpack-plugin). The `options` are passed to the plugin.

##### `I18nLoaderPlugin( options )`

This provides an instance of [@automattic/i18n-loader-webpack-plugin](https://www.npmjs.com/package/@automattic/i18n-loader-webpack-plugin). The `options` are passed to the plugin.

Note that if the plugin actually does anything in your build, you'll need to specify at least the `domain` option for it.

##### `I18nCheckPlugin( options )`

This provides an instance of [@wordpress/i18n-check-webpack-plugin](https://www.npmjs.com/package/@wordpress/i18n-check-webpack-plugin). The `options` are passed to the plugin.

The default configuration sets a filter that excludes `node_modules` other than `@automattic/*`. This may be accessed as `I18nCheckPlugin.defaultFilter`.

#### Module rules and loaders

Note all rule sets are provided as factory functions returning a single rule.

##### `TranspileRule( options )`

Transpiles JavaScript using Babel. Generally you'll use this twice, once setting `exclude` to `/node_modules\//` and once setting `includeNodeModules` to list any modules that need transpilation.

Options are:
- `include`: Filter modules to only include those matching this [condition](https://webpack.js.org/configuration/module/#condition).
- `exclude`: Filter modules to exclude those matching this [condition](https://webpack.js.org/configuration/module/#condition).
- `includeNodeModules`: An array of module name prefixes to transpile. Usually each name should end with a `/`, as just "foo" would match "foobar" too.
- `threadOpts`: Options to pass to [thread-loader](https://webpack.js.org/loaders/thread-loader/).
- `babelOpts`: Options to pass to [babel-loader](https://www.npmjs.com/package/babel-loader). Note that the following defaults are applied:
  - `babelrc`: `false`.
  - `cacheDirectory`: `path.resolve( '.cache/babel` )`.
  - `cacheCompression`: `true`.
  - If `path.resolve( 'babel.config.js' )` exists, `configFile` will default to that. Otherwise, `presets` will default to set some appropriate defaults (which will require the peer dependencies on [@babel/core](https://www.npmjs.com/package/@babel/core) and [@babel/runtime](https://www.npmjs.com/package/@babel/runtime)).

##### `CssRule( options )`

Handles CSS using [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin) and [css-loader](https://www.npmjs.com/package/css-loader)

Note we intentionally don't supply [sass-loader](https://www.npmjs.com/package/sass-loader) or [postcss-loader](https://www.npmjs.com/package/postcss-loader). These need extra dependencies and configuration making it better to let you include them yourself (e.g. via the `extraLoaders` option) if you need them.

Options are:
- `extensions`: Array of extensions to handle. Default is to only handle `css`.
  You'll likely need to set this if you use `extraLoaders` to include [sass-loader](https://www.npmjs.com/package/sass-loader) or something like that.
- `MiniCssExtractLoader`: Options for `mini-css-extract-plugin`'s loader. The default options set `chunkFilename` to `[name].css?minify=false&ver=[contenthash]` as a cache buster.
- `CssLoader`: Options for `css-loader`. Note its `importLoaders` option is handled automatically based on the length of `extraLoaders`.
- `extraLoaders`: An array of additional loaders, to run before the provided loaders.

The individual loaders may be created via `CssRule.MiniCssExtractLoader( options )` and `CssRule.CssLoader( options )`, in case you'd rather construct a CSS-handling rule manually while still using the bundled versions of these dependencies.

##### `FileRule( options )`

This is a simple [asset module](https://webpack.js.org/guides/asset-modules/) rule for bundling files. If you want anything more complicated, don't try to extend this. Asset module rules are simple enough that you can just write one,

Options are:
- `filename`: Output filename pattern. Default is `images/[name]-[contenthash][ext]`.
- `extensions`: Array of extensions to handle. Default is `[ 'gif', 'jpg', 'jpeg', 'png', 'svg' ]`.
- `maxInlineSize`: If set to a number greater than 0, files will be inlined if they are smaller than this. Default is 0.

### Babel

Note that if you use any of the Babel configs, you'll want to satisfy the peer dependency on [@babel/core](https://www.npmjs.com/package/@babel/core).

You'll also want to satisfy the peer dependency on [@babel/runtime](https://www.npmjs.com/package/@babel/runtime) if you don't set `pluginTransformRuntime` to false. It can be a dev dependency (despite Babel's docs), assuming you're using Babel from within Webpack.

#### `isProduction`, `isDevelopment`

`isProduction` and `isDevelopment` are booleans indicating whether we're running in production or development mode. One will be true, the other false. You can use these if you want to vary your own configuration based on the model.

#### `preset`

This is a Babel preset that can be used from within your Babel configuration like any other preset.

The options passed to the preset allow you to exclude (by passing false) or amend the configuration of (by passing an object) every part of the preset. For example, if you wanted to exclude `@babel/preset-typescript` and set the `runtime` option of `@babel/preset-react`, you'd pass options like
```json
{
	presetTypescript: false,
	presetReact: { runtime: 'automatic' },
}
```

The options and corresponding components are:

- `presetEnv`: Corresponds to [@babel/preset-env](https://www.npmjs.com/package/@babel/preset-env).

  Note the following options that are different from `@babel/preset-env`'s defaults:
  - `exclude`: Set to `[ 'transform-typeof-symbol' ]`, as that [apparently makes all code slower](https://github.com/facebook/create-react-app/pull/5278).
  - `targets`: Set to your browserslist config if available, otherwise set to [@wordpress/browserslist-config](https://www.npmjs.com/package/@wordpress/browserslist-config).
- `presetReact`: Corresponds to [@babel/preset-react](https://www.npmjs.com/package/@babel/preset-react).
- `presetTypescript`: Corresponds to [@babel/preset-typescript](https://www.npmjs.com/package/@babel/preset-typescript).
- `pluginReplaceTextdomain`: Corresponds to [@automattic/babel-plugin-replace-textdomain](https://www.npmjs.com/package/@automattic/babel-plugin-replace-textdomain).
  Note this plugin is only included if this option is set, as the plugin requires a `textdomain` option be set.
- `pluginProposalClassProperties`: Corresponds to [@babel/plugin-proposal-class-properties](https://www.npmjs.com/package/@babel/plugin-proposal-class-properties).
- `pluginTransformRuntime`: Corresponds to [@babel/plugin-transform-runtime](https://www.npmjs.com/package/@babel/plugin-transform-runtime).

  Note the following options that are different from `@babel/plugin-transform-runtime`'s defaults:
  - `corejs`: Set false as WordPress normally includes its own polyfills.
  - `regenerator`: Set false.
  - `absoluteRuntime`: Set true, as otherwise transpilation of code symlinked in node_modules (i.e. everything when using pnpm) breaks.
  - `version`: Set to the version from `@babel/runtime`.
- `pluginPreserveI18n`: Corresponds to [@automattic/babel-plugin-preserve-i18n](https://www.npmjs.com/package/@automattic/babel-plugin-preserve-i18n).
