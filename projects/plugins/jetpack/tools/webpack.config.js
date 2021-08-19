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
		'output-path': path.join( path.dirname( __dirname ), '_inc', 'build' ),
	}
);

const sharedWebpackConfig = {
	...baseWebpackConfig,
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
			admin: path.join( path.dirname( __dirname ), '_inc/client', 'admin.js' ),
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
