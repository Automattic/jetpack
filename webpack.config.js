/**
 * External dependencies
 */
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const WordPressExternalDependenciesPlugin = require( '@automattic/wordpress-external-dependencies-plugin' );

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {}, // We'll override later
		'output-filename': '[name].js',
		'output-path': path.join( __dirname, '_inc', 'build' ),
	}
);

const sharedWebpackConfig = {
	...baseWebpackConfig,
	resolve: {
		...baseWebpackConfig.resolve,
		modules: [ path.resolve( __dirname, '_inc/client' ), 'node_modules' ],
	},
	node: {
		fs: 'empty',
		process: true,
	},
	devtool: isDevelopment ? 'source-map' : false,
};

// We export two configuration files: One for admin.js, and one for static.jsx. The latter produces pre-rendered HTML.
module.exports = [
	{
		...sharedWebpackConfig,
		// Entry points point to the javascript module
		// that is used to generate the script file.
		// The key is used as the name of the script.
		entry: { admin: path.join( __dirname, './_inc/client/admin.js' ) },
		plugins: [ ...sharedWebpackConfig.plugins, new WordPressExternalDependenciesPlugin() ],
	},
	{
		...sharedWebpackConfig,
		// Entry points point to the javascript module
		// that is used to generate the script file.
		// The key is used as the name of the script.
		entry: { static: path.join( __dirname, './_inc/client/static.jsx' ) },
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
								devMode: {
									isActive: false,
								},
							},
							userData: {
								currentUser: {
									permissions: {},
								},
							},
						},
					},
				},
			} ),
		],
	},
	{
		...sharedWebpackConfig,
		entry: { search: path.join( __dirname, './modules/search/instant-search/index.jsx' ) },
		output: {
			...sharedWebpackConfig.output,
			path: path.join( __dirname, '_inc/build/instant-search' ),
			filename: 'jp-search.bundle.js',
		},
		performance: isDevelopment
			? {}
			: {
					maxAssetSize: 30000,
					maxEntrypointSize: 30000,
					hints: 'warning',
			  },
	},
];
