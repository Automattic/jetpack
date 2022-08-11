const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );

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
	entry: { 'action-bar': path.join( __dirname, './src/action-bar.jsx' ) },
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, './build' ),
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
			'react-dom': require.resolve( 'preact/compat' ), // Must be below test-utils
			fs: false,
		},
	},
	node: false,
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: {
				injectPolyfill: true,
				useDefaults: false,
				requestToExternal,
				requestToHandle: defaultRequestToHandle,
			},
			I18nLoaderPlugin: { textdomain: 'jetpack-action-bar' },
		} ),
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
