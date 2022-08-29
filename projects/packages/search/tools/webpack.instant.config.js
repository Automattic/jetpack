const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const definePaletteColorsAsStaticVariables = require( './define-palette-colors-as-static-variables' );

const webpack = jetpackWebpackConfig.webpack;

/**
 * Used to determine if the module import request should be externalized.
 * For instant search, we prevent react and react-dom from being externalized by the Gutenberg toolchain.
 * This enables us to alias Preact to all React imports.
 *
 * @param {string} request - Requested module
 * @returns {(string|string[]|undefined)} Script global
 */
function requestToExternal( request ) {
	// Ensure that React will be aliased to preact/compat by preventing externalization.
	if ( request === 'react' || request === 'react-dom' ) {
		return;
	}
	return defaultRequestToExternal( request );
}

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	entry: {
		'jp-search': path.join( __dirname, '../src/instant-search/loader.js' ),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/instant-search' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		splitChunks: {
			// Unused keys are prefixed with underscores, as per eslint recommendation.
			name: ( _module, _chunks, key ) => `jp-search.${ key }`,
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			react: require.resolve( 'preact/compat' ),
			'react-dom/test-utils': require.resolve( 'preact/test-utils' ),
			'react-dom': require.resolve( 'preact/compat' ), // Must be aliased after test-utils
			fs: false,
		},
		modules: [
			path.resolve( __dirname, '../src/instant-search' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ), // For core-js
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
				useDefaults: false,
				requestToExternal,
				requestToHandle: defaultRequestToHandle,
			},
			I18nLoaderPlugin: { textdomain: 'jetpack-search-pkg' },
		} ),
		// Replace 'debug' module with a dummy implementation in production
		...( jetpackWebpackConfig.isDevelopment
			? []
			: [
					new webpack.NormalModuleReplacementPlugin(
						/^debug$/,
						path.resolve( __dirname, '../src/instant-search/lib/dummy-debug' )
					),
			  ] ),
		definePaletteColorsAsStaticVariables(),
	],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript except node modules.
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-', 'tiny-lru/' ],
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					'sass-loader',
				],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};
