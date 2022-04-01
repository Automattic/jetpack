/**
 * External dependencies
 */
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const glob = require( 'glob' );
const path = require( 'path' );
const StaticSiteGeneratorPlugin = require( 'static-site-generator-webpack-plugin' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const NodePolyfillPlugin = require( 'node-polyfill-webpack-plugin' );

const webpack = jetpackWebpackConfig.webpack;
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
							postcssOptions: { config: path.join( __dirname, 'postcss.config.js' ) },
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

const moduleCssEntries = {
	'_inc/build/style.min': path.join( __dirname, '../_inc/client', 'scss/style.scss' ),
};
// prettier-ignore
for ( const file of glob
	.sync( 'modules/calypsoify/*.scss' )
	.filter( n => ! path.basename( n ).startsWith( '_' ) )
) {
	moduleCssEntries[ file.substring( 0, file.length - 5 ) + '.min' ] = './' + file;
}
// prettier-ignore
for ( const file of glob
	.sync( 'scss/*.scss' )
	.filter( n => ! path.basename( n ).startsWith( '_' ) )
) {
	moduleCssEntries[ 'css/' + file.substring( 5, file.length - 5 ) ] = './' + file;
	moduleCssEntries[ 'css/' + file.substring( 5, file.length - 5 ) + '.min' ] = './' + file;
}

module.exports = [
	// Build all the modules.
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
	// Build module CSS.
	{
		...sharedWebpackConfig,
		entry: moduleCssEntries,
		output: {
			...sharedWebpackConfig.output,
			path: path.join( __dirname, '..' ),
		},
		optimization: {
			...sharedWebpackConfig.optimization,
			minimizer: [
				jetpackWebpackConfig.CssMinimizerPlugin( {
					exclude: /^css\/.*(?<!\.min(?:\.rtl)?\.css)$/,
				} ),
			],
		},
		module: {
			strictExportPresence: true,
			rules: [
				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [
						{
							loader: 'postcss-loader',
							options: {
								postcssOptions: { plugins: { autoprefixer: {} } },
							},
						},
						{
							loader: 'sass-loader',
							options: {
								sassOptions: {
									// The minifier will minify if necessary.
									outputStyle: 'expanded',
								},
							},
						},
					],
				} ),

				// Leave fonts and images in place.
				{
					test: /\.(eot|ttf|woff|png|svg)$/i,
					type: 'asset/resource',
					generator: {
						emit: false,
						filename: '[file]',
					},
				},
			],
		},
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: false,
				I18nLoaderPlugin: false,
				I18nCheckPlugin: false,
			} ),
			// Delete the dummy JS files Webpack would otherwise create.
			new RemoveAssetWebpackPlugin( {
				assets: /\.js(\.map)?$/,
			} ),
			// Rename rtl assets in css/ and modules/calypsoify, existing code uses a different naming convention from everything else. Sigh.
			// @todo Fix that and delete this.
			{
				apply( compiler ) {
					compiler.hooks.thisCompilation.tap( 'Renamer', compilation => {
						compilation.hooks.processAssets.tap(
							{
								name: 'Renamer',
								stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
								additionalAssets: true,
							},
							assets => {
								for ( const [ name, asset ] of Object.entries( assets ) ) {
									const m = name.match(
										/^(css\/.*?|modules\/calypsoify\/(?:style|style-gutenberg))((?:\.min)?)\.rtl\.css$/
									);
									if ( m ) {
										delete assets[ name ];
										assets[ `${ m[ 1 ] }-rtl${ m[ 2 ] }.css` ] = asset;
									}
								}
							}
						);
					} );
				},
			},
		],
	},
	// Build masterbar CSS.
	require( './webpack.config.masterbar.js' ),
	// Build admin page JS.
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
	// Build static.jsx (which produces pre-rendered HTML).
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
