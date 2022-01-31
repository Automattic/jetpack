/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const glob = require( 'glob' );
const path = require( 'path' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const NodePolyfillPlugin = require( 'node-polyfill-webpack-plugin' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.isDevelopment ? 'source-map' : false,
	output: {
		...jetpackWebpackConfig.output,
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
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Transpile @automattic/* in node_modules too.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@automattic/', 'debug/' ],
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
			'plugins-page': path.join( __dirname, '../_inc/client', 'plugins-entry.js' ),
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			...jetpackWebpackConfig.DependencyExtractionPlugin( { injectPolyfill: true } ),
			new NodePolyfillPlugin(),
		],
		externals: {
			...sharedWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack',
			} ),
		},
	},
	{
		...sharedWebpackConfig,
		entry: { static: path.join( __dirname, '../_inc/client', 'static.jsx' ) },
		output: {
			...sharedWebpackConfig.output,
			libraryTarget: 'commonjs2',
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: false,
				I18nLoaderPlugin: false,
				I18nCheckPlugin: false,
			} ),
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
			new RemoveAssetWebpackPlugin( {
				assets: /\.(css|js)(\.map)?$/,
			} ),
		],
	},
];
