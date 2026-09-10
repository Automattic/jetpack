const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const { glob } = require( 'glob' );
const webpack = require( 'webpack' );
const StaticSiteGeneratorPlugin = require( './static-site-generator-webpack-plugin' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	cache: jetpackWebpackConfig.cache( __filename ),
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
			crypto: false,
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

			// Workarounds for non-extracted `@wordpress/*` packages.
			...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

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
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
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
	'publicize',
	'custom-post-types',
	'sharedaddy',
	'contact-form',
	'carousel',
	'related-posts',
	'tiled-gallery',
	'likes',
	'infinite-scroll',
	'videopress',
	'comment-likes',
	'scan',
	'wordads',
	'theme-tools/responsive-videos',
];

const moduleSources = [
	...glob.sync( '_inc/*.{js,jsx}' ),
	...supportedModules.map( dir => glob.sync( `modules/${ dir }/**/*.{js,jsx}` ) ).flat(),
]
	.filter( name => ! name.endsWith( '.min.js' ) && name.indexOf( '/test/' ) < 0 )
	// For historical reasons, this is handled separately.
	.filter( name => ! /\/widget-visibility\/.*\.jsx$/.test( name ) );

// Library definitions for certain modules.
const libraryDefs = {
	'widgets/google-translate/google-translate': {
		name: 'googleTranslateElementInit',
		type: 'assign',
	},
};

const moduleEntries = {};
for ( const module of moduleSources ) {
	const name = module.replace( /\.jsx?$/, '' ).replace( /^(_inc|modules)\//, '' );
	if ( moduleEntries[ name ] ) {
		throw new Error(
			`Ambiguous module entry "${ name }": both ${ moduleEntries[ name ].import } and ./${ module } exist. Pick one.`
		);
	}
	moduleEntries[ name ] = {
		import: './' + module,
	};
	if ( libraryDefs[ name ] ) {
		moduleEntries[ name ].library = libraryDefs[ name ];
	}
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
	/*
	 * Build the newsletter widget on its own so it gets an unminified `newsletter-widget.js`
	 * (the legacy module config above forces `[name].min.js`). This is the only build for it;
	 * the unminified file is what supports extracting translatable strings.
	 */
	{
		...sharedWebpackConfig,
		entry: {
			'newsletter-widget': './modules/subscriptions/newsletter-widget/src/index.tsx',
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			...jetpackWebpackConfig.DependencyExtractionPlugin(),
		],
	},
	/*
	 * The newsletter email design editor, on its own entry: `@woocommerce/email-editor`
	 * is large and only ever needed on the one admin screen that mounts it.
	 */
	{
		...sharedWebpackConfig,
		entry: {
			// The package's `exports` map publishes only its main entry, so the stylesheet
			// cannot be imported by subpath. Pairing it here keeps it in the CSS pipeline
			// and gets an RTL build.
			'email-design-editor': [
				'./modules/subscriptions/email-design-editor/src/index.jsx',
				path.join(
					path.dirname( require.resolve( '@woocommerce/email-editor' ) ),
					'../build-style/style.css'
				),
			],
		},
		plugins: [
			...sharedWebpackConfig.plugins,

			// Some of the package's strings ship with the textdomain left as a
			// `__i18n_text_domain__` placeholder. Unreplaced it is a free variable, so those
			// strings throw a ReferenceError when their component renders.
			new webpack.DefinePlugin( {
				__i18n_text_domain__: JSON.stringify( 'jetpack' ),
			} ),
			...jetpackWebpackConfig.DependencyExtractionPlugin( {
				requestMap: {
					// Not a WP script handle (ships no `wpScript`), so there's nothing to
					// externalize to. Belongs in the dep-extraction plugin's
					// `BUNDLED_PACKAGES` but isn't there as of 6.54.0, so opt it out here.
					'@wordpress/global-styles-engine': { external: false },
				},
			} ),
		],
		module: {
			...sharedWebpackConfig.module,
			rules: [
				...sharedWebpackConfig.module.rules,

				// The package's strings are authored against the `woocommerce` textdomain,
				// which no Jetpack site loads, so without this the editor renders untranslated.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@woocommerce/email-editor/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack' },
							],
						],
					},
				} ),
			],
		},
	},
	// Build admin page JS.
	{
		...sharedWebpackConfig,
		entry: {
			admin: {
				import: path.join( __dirname, '../_inc/client', 'admin.jsx' ),
				// I don't know if we really need to export this. We were in the past, maybe some third party uses it.
				library: {
					name: 'getRouteName',
					type: 'window',
					export: 'getRouteName',
				},
			},
			'plugins-page': path.join( __dirname, '../_inc/client', 'plugins-entry.jsx' ),
			'network-admin': path.join( __dirname, '../_inc/client', 'network-admin.tsx' ),
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			...jetpackWebpackConfig.DependencyExtractionPlugin( {
				// Match the AI admin build: @wordpress/ui (pulled in via the licensing
				// activation screen) drags in @wordpress/theme and @wordpress/private-apis.
				// They are not registered as WP script handles on the main Jetpack admin
				// path (WP < 7.0 has no core wp-theme, and this page does not load the
				// wp-build-polyfills shim), so bundle them instead of externalizing to
				// avoid the whole dashboard script failing to enqueue.
				requestMap: {
					'@wordpress/theme': { external: false },
					'@wordpress/private-apis': { external: false },
				},
			} ),
		],
		externals: {
			...sharedWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack',
			} ),
		},
	},
	// Build AI admin page JS.
	{
		...sharedWebpackConfig,
		entry: {
			'jetpack-ai-admin': path.join( __dirname, '../_inc/client', 'ai-admin.jsx' ),
		},
		plugins: [
			...sharedWebpackConfig.plugins,
			...jetpackWebpackConfig.DependencyExtractionPlugin( {
				// @wordpress/ui pulls in @wordpress/theme, which is not a reliable WP script
				// handle in all contexts, so bundle it instead of externalizing it. Keep
				// @wordpress/private-apis external so bundled DataViews can unlock private APIs
				// exposed by external WordPress packages such as @wordpress/components.
				requestMap: {
					'@wordpress/theme': { external: false },
				},
			} ),
		],
		externals: {
			...sharedWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack',
			} ),
		},
	},
	// Build generator.jsx (which produces pre-rendered HTML).
	{
		...sharedWebpackConfig,
		entry: { static: path.join( __dirname, '../_inc/client', 'generator.jsx' ) },
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
