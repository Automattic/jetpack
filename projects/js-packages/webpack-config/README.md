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
			{
				test: /\.css$/,
				use: [
					jetpackWebpackConfig.MiniCssExtractLoader(),
					jetpackWebpackConfig.CssCacheLoader(),
					jetpackWebpackConfig.CssLoader( {
						importLoaders: 0, // Set to the number of loaders after this one in the array, e.g. 2 if you use both postcss-loader and sass-loader.
					} ),
					// Any other CSS-related loaders, such as 'postcss-loader' or 'sass-loader'.
				],
			},

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

- `filename`: `[name].min.js`. The `.min.js` bit is required to avoid a broken auto-minifier on WordPress.com infrastructure.
- `chunkFilename`: `[name]-[id].H[contenthash:20].min.js`. The content hash serves as a cache buster; while Webpack would accept something like `[name]-[id].min.js?ver=[contenthash]`, [some of the modules we use do not](https://github.com/Automattic/jetpack/issues/21349#issuecomment-940191828).

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

##### Minification and i18n translator comments

To avoid the minifier dropping or misplacing the translator comments, it's best to keep the comment as close to the function call as possible. For example, in
```js
const a, b, c;

/* translators: This is a bad example. */
const example = __( 'Example', 'domain' );
```
the minifier will combine those into a single `const` statement and misplace the comment on the way. To fix it, move the comment to the variable declaration instead of the `const` statement:
```js
const a, b, c;

const
	/* translators: This is a bad example. */
	example = __( 'Example', 'domain' );
```
Similarly in jsx, a comment placed like this may wind up misplaced:
```js
<Tag
	/* translators: This is a bad example. */
	property={ __( 'Here's another example', 'domain' ) }
/>
```
Instead put it inside the property:
```js
<Tag
	property={
		/* translators: This is an example of how to do it right. */
		__( 'Here's another example', 'domain' )
	}
/>
```

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

#### Module rules and loaders

Note all rule sets and loaders are provided as factory functions returning a single rule or use-entry.

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

##### `FileRule( options )`

This is a simple [asset module](https://webpack.js.org/guides/asset-modules/) rule for bundling files. If you want anything more complicated, don't try to extend this. Asset module rules are simple enough that you can just write one,

Options are:
- `filename`: Output filename pattern. Default is `images/[name]-[contenthash][ext]`.
- `extensions`: Array of extensions to handle. Default is `[ 'gif', 'jpg', 'jpeg', 'png', 'svg' ]`.
- `maxInlineSize`: If set to a number greater than 0, files will be inlined if they are smaller than this. Default is 0.

##### `MiniCssExtractLoader( options )`, `CssLoader( options )`, `CssCacheLoader( options )`

These are loaders that might be included in a CSS-related rule.

* `MiniCssExtractLoader` is the loader for [mini-css-extract-plugin](https://www.npmjs.com/package/mini-css-extract-plugin). Options are passed to the loader.
* `CssLoader` is the loader for [css-loader](https://www.npmjs.com/package/css-loader). Options are passed to the loader.
* `CssCacheLoader` is an instance of [cache-loader](https://www.npmjs.com/package/cache-loader). Options are passed to the loader. The default options set `cacheDirectory` to `.cache/css-loader`.

Note we intentionally don't supply [sass-loader](https://www.npmjs.com/package/sass-loader) or [postcss-loader](https://www.npmjs.com/package/postcss-loader). These need extra dependencies and configuration making it better to let you include them yourself if you need them.

```json
{
	test: /\.css$/,
	use: [
		jetpackWebpackConfig.MiniCssExtractLoader(),
		jetpackWebpackConfig.CssCacheLoader(),
		jetpackWebpackConfig.CssLoader( {
			importLoaders: 0, // Set to the number of loaders after this one in the array, e.g. 2 if you use both postcss-loader and sass-loader.
		} ),
		// Any other CSS-related loaders, such as 'postcss-loader' or 'sass-loader'.
	],
}
```

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
- `pluginProposalClassProperties`: Corresponds to [@babel/plugin-proposal-class-properties](https://www.npmjs.com/package/@babel/plugin-proposal-class-properties).
- `pluginTransformRuntime`: Corresponds to [@babel/plugin-transform-runtime](https://www.npmjs.com/package/@babel/plugin-transform-runtime).

  Note the following options that are different from `@babel/plugin-transform-runtime`'s defaults:
  - `corejs`: Set false as WordPress normally includes its own polyfills.
  - `regenerator`: Set false.
  - `absoluteRuntime`: Set true, as otherwise transpilation of code symlinked in node_modules (i.e. everything when using pnpm) breaks.
  - `version`: Set to the version from `@babel/runtime`.
- `pluginPreserveI18n`: Corresponds to [@automattic/babel-plugin-preserve-i18n](https://www.npmjs.com/package/@automattic/babel-plugin-preserve-i18n).
