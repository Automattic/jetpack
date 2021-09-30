/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const NodePolyfillPlugin = require( 'node-polyfill-webpack-plugin' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {}, // We'll override later
		'output-filename': '[name].js',
		'output-chunk-filename': '[name].[contenthash].js',
		'output-path': path.join( path.dirname( __dirname ), '_inc', 'build' ),
		// Calypso-build defaults this to "window", which breaks things if no library.name is set.
		'output-library-target': '',
	}
);

const sharedWebpackConfig = {
	...baseWebpackConfig,
	optimization: {
		...baseWebpackConfig.optimization,
		// This optimization sometimes causes webpack to drop `__()` and such.
		concatenateModules: false,
	},
	resolve: {
		...baseWebpackConfig.resolve,
		modules: [ path.resolve( path.dirname( __dirname ), '_inc/client' ), 'node_modules' ],
		// We want the compiled version, not the "calypso:src" sources.
		mainFields: baseWebpackConfig.resolve.mainFields.filter( entry => 'calypso:src' !== entry ),
		alias: {
			...baseWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	node: {},
	devtool: isDevelopment ? 'source-map' : false,
};

// We export two configuration files: One for admin.js, and one for static.jsx. The latter produces pre-rendered HTML.
module.exports = [
	{
		...sharedWebpackConfig,
		// Entry points point to the javascript module
		// that is used to generate the script file.
		// The key is used as the name of the script.
		entry: {
			admin: {
				import: path.join( path.dirname( __dirname ), '_inc/client', 'admin.js' ),
				// I don't know if we really need to export this. We were in the past, maybe some third party uses it.
				library: {
					name: 'getRouteName',
					type: 'window',
					export: 'getRouteName',
				},
			},
			'search-dashboard': path.join( __dirname, '../_inc/client', 'search-dashboard-entry.js' ),
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			new NodePolyfillPlugin(),
			new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		],
	},
	{
		...sharedWebpackConfig,
		// Entry points point to the javascript module
		// that is used to generate the script file.
		// The key is used as the name of the script.
		entry: { static: path.join( path.dirname( __dirname ), '_inc/client', 'static.jsx' ) },
		output: {
			...sharedWebpackConfig.output,
			pathinfo: true,
			libraryTarget: 'commonjs2',
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			new StaticSiteGeneratorPlugin( {
				globals: {
					window: {
						Initial_State: {
							dismissedNotices: [],
							connectionStatus: {
								offlineMode: {
									isActive: false,
								},
							},
							userData: {
								currentUser: {
									permissions: {},
								},
							},
							licensing: {
								error: '',
							},
						},
					},
				},
			} ),
		],
	},
];
