/**
 * External dependencies
 */
const _ = require( 'lodash' );
const getBaseWebpackConfig = require( '@automattic/calypso-build/webpack.config.js' );
const path = require( 'path' );
const webpack = require( 'webpack' );
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

// The following mocks are required to make `@wordpress/` npm imports work with server-side rendering.
// Hopefully, most of them can be dropped once https://github.com/WordPress/gutenberg/pull/16227 lands.
const componentMocks = {
	Mousetrap: {
		init: _.noop,
		prototype: {},
	},
	document: { addEventListener: _.noop, createElement: _.noop, head: { appendChild: _.noop } },
	navigator: {},
	window: {
		addEventListener: _.noop,
		// See https://github.com/WordPress/gutenberg/blob/f3b6379327ce3fb48a97cb52ffb7bf9e00e10130/packages/jest-preset-default/scripts/setup-globals.js
		matchMedia: () => ( {
			addListener: () => {},
		} ),
		navigator: { platform: '', userAgent: '' },
		Node: {
			TEXT_NODE: '',
			ELEMENT_NODE: '',
			DOCUMENT_POSITION_PRECEDING: '',
			DOCUMENT_POSITION_FOLLOWING: '',
		},
		URL: {},
	},
};

// We export two configuration files: One for admin.js, and one for static.jsx.
// The latter produces pre-rendered HTML.
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
		entry: {
			static: path.join( __dirname, './_inc/client/static.jsx' ),
		},
		output: {
			...sharedWebpackConfig.output,
			pathinfo: true,
			libraryTarget: 'commonjs2',
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			new webpack.NormalModuleReplacementPlugin(
				/^@wordpress\/i18n$/,
				path.join( __dirname, './_inc/client/i18n-to-php' )
			),
			new StaticSiteGeneratorPlugin( {
				globals: _.merge( {}, componentMocks, {
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
				} ),
			} ),
		],
	},
	{
		...sharedWebpackConfig,
		entry: { search: path.join( __dirname, './_inc/search/src/index.jsx' ) },
		output: {
			...sharedWebpackConfig.output,
			path: path.resolve( __dirname, '_inc/search/dist' ),
			filename: 'jp-search.bundle.js',
		},
		performance: isDevelopment
			? {}
			: {
					maxAssetSize: 30000,
					maxEntrypointSize: 30000,
					hints: 'error',
			  },
	},
];
