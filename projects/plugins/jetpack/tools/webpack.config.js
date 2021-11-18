/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const glob = require( 'glob' );
const path = require( 'path' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const NodePolyfillPlugin = require( 'node-polyfill-webpack-plugin' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	output: {
		...jetpackWebpackConfig.output,
		filename: '[name].js',
		chunkFilename: '[name].[contenthash].js',
		path: path.join( __dirname, '../_inc/build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ path.resolve( __dirname, '../_inc/client' ), 'node_modules' ],
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	node: {},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: false,
		} ),
	],
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/jetpack-* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/jetpack-', 'debug/' ],
			} ),

			// Handle CSS.
			{
				test: /\.(?:css|s[ac]ss)$/,
				use: [
					jetpackWebpackConfig.MiniCssExtractLoader(),
					jetpackWebpackConfig.CssCacheLoader(),
					jetpackWebpackConfig.CssLoader( {
						importLoaders: 2, // Set to the number of loaders after this one in the array, e.g. 2 if you use both postcss-loader and sass-loader.
					} ),
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					'sass-loader',
				],
			},

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
};

const supportedModules = [
	'shortcodes',
	'widgets',
	'widget-visibility',
	'custom-css',
	'publicize',
	'custom-post-types',
	'sharedaddy',
	'contact-form',
	'photon',
	'carousel',
	'related-posts',
	'tiled-gallery',
	'likes',
	'infinite-scroll',
	'masterbar',
	'videopress',
	'comment-likes',
	'lazy-images',
	'scan',
	'wordads',
];

const moduleSources = [
	...glob.sync( '_inc/*.js' ),
	...glob.sync( `modules/@(${ supportedModules.join( '|' ) })/**/*.js` ),
].filter( name => ! name.endsWith( '.min.js' ) && ! /\/test-[^/]\.js$/.test( name ) );

// Library definitions for certain modules.
const libraryDefs = {
	'carousel/swiper-bundle': {
		name: 'Swiper670',
		type: 'umd',
	},
	'widgets/google-translate/google-translate': {
		name: 'googleTranslateElementInit',
		type: 'assign',
	},
};

const moduleEntries = {};
for ( const module of moduleSources ) {
	const name = module.slice( 0, -3 ).replace( /^(_inc|modules)\//, '' );
	moduleEntries[ name ] = {
		import: './' + module,
	};
	if ( libraryDefs[ name ] ) {
		moduleEntries[ name ].library = libraryDefs[ name ];
	}
}

// We export three configuration files: One for modules, one for admin.js, and one for static.jsx (which produces pre-rendered HTML).
module.exports = [
	{
		...sharedWebpackConfig,
		entry: moduleEntries,
		plugins: [
			...sharedWebpackConfig.plugins,
			...jetpackWebpackConfig.DependencyExtractionPlugin(),
		],
		output: {
			...sharedWebpackConfig.output,
			filename: '[name].min.js', // @todo: Fix this.
		},
	},
	{
		...sharedWebpackConfig,
		entry: {
			admin: {
				import: path.join( __dirname, '../_inc/client', 'admin.js' ),
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
			...jetpackWebpackConfig.DependencyExtractionPlugin( { injectPolyfill: true } ),
			new NodePolyfillPlugin(),
		],
	},
	{
		...sharedWebpackConfig,
		entry: { static: path.join( __dirname, '../_inc/client', 'static.jsx' ) },
		output: {
			...sharedWebpackConfig.output,
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
