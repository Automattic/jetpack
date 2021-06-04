/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const {
	defaultRequestToExternal,
	defaultRequestToHandle,
} = require( '@wordpress/dependency-extraction-webpack-plugin/util' );
const { readFileSync } = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Since the version number in package.json doesn't match PHP's `JETPACK__VERSION` constant,
 * we rely on extracting the `JETPACK__VERSION` constant directly from the plugin PHP file
 * for use in our Webpack configuration.
 *
 * Examples of JETPACK__VERSION are: `9.8-alpha`, `9.8-beta`, `9.8`, `9.8.1`, `9.8.2`.
 */
const pluginFileContent = readFileSync( path.join( __dirname, '../jetpack.php' ) ).toString();
const jetpackAlphaNumericVersionMatch = pluginFileContent.match(
	/define\(\s+'JETPACK__VERSION',\s+'([0-9A-Za-z.-]+)'\s+\)/
);
const bundleVersionExtension =
	jetpackAlphaNumericVersionMatch?.length > 0
		? `.${ jetpackAlphaNumericVersionMatch[ 1 ].replace( /[^0-9A-Za-z]+/g, '-' ) }`
		: '';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {
			main: path.join( __dirname, '../modules/search/instant-search/loader.js' ),
			'ie11-polyfill-loader': path.join(
				__dirname,
				'../modules/search/instant-search/ie11-polyfill.js'
			),
			'ie11-polyfill-payload': [
				require.resolve( 'core-js' ),
				require.resolve( 'regenerator-runtime/runtime' ),
				require.resolve( 'whatwg-fetch' ),
				require.resolve( 'abortcontroller-polyfill/dist/polyfill-patch-fetch' ),
			],
		},
		'output-chunk-filename': 'jp-search.chunk-[name]-[hash].js',
		'output-filename': `jp-search-[name].bundle${ bundleVersionExtension }.js`,
		'output-path': path.join( __dirname, '../_inc/build/instant-search' ),
	}
);

/**
 * Determines if the module import request should be externalized.
 *
 * @param {string} request - Requested module
 * @returns {(string|string[]|undefined)} Script global
 */
function requestToExternal( request ) {
	// Prevent React from being externalized. This ensures that React will be properly aliased to preact/compat.
	if ( request === 'react' || request === 'react-dom' ) {
		return;
	}
	return defaultRequestToExternal( request );
}

const moduleConfig = { ...baseWebpackConfig.module };
// NOTE: tiny-lru publishes non-ES5 as a browser target. It's necessary to let babel-loader transpile this module.
moduleConfig.rules[ 0 ].exclude = /[\\/]node_modules[\\/](?!(\.pnpm|tiny-lru)[\\/])/;

module.exports = {
	...baseWebpackConfig,
	module: moduleConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		alias: {
			...baseWebpackConfig.resolve.alias,
			react: 'preact/compat',
			'react-dom/test-utils': 'preact/test-utils',
			'react-dom': 'preact/compat', // Must be aliased after test-utils
		},
		modules: [
			path.resolve( __dirname, '../_inc/client' ),
			path.resolve( __dirname, '../node_modules' ),
			'node_modules',
		],
	},
	node: {
		fs: 'empty',
	},
	devtool: isDevelopment ? 'source-map' : false,
	plugins: [
		new webpack.DefinePlugin( {
			// Replace palette colors as individual literals in the bundle.
			PALETTE: ( () => {
				const colors = require( '@automattic/color-studio' ).colors;
				const stringifiedColors = {};

				// DefinePlugin replaces the values as unescaped text.
				// We therefore need to double-quote each value, to ensure it ends up as a string.
				for ( const color in colors ) {
					stringifiedColors[ color ] = `"${ colors[ color ] }"`;
				}

				return stringifiedColors;
			} )(),
		} ),
		...baseWebpackConfig.plugins,
		// Replace 'debug' module with a dummy implementation in production
		...( isDevelopment
			? []
			: [
					new webpack.NormalModuleReplacementPlugin(
						/^debug$/,
						path.resolve( __dirname, '../modules/search/instant-search/lib/dummy-debug' )
					),
			  ] ),
		new DependencyExtractionWebpackPlugin( {
			injectPolyfill: true,
			useDefaults: false,
			requestToExternal,
			requestToHandle: defaultRequestToHandle,
		} ),
	],
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: false,
			},
		},
	},
};
