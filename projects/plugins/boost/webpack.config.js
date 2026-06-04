const webpack = require( 'webpack' );
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const CopyPlugin = require( 'copy-webpack-plugin' );

const imageGuideCopyPatterns = [
	{
		from: path.join(
			path.dirname( require.resolve( '@automattic/jetpack-image-guide' ) ),
			'guide.css'
		),
		// Emit as `.min.css` so the concatenation serving path treats it as already
		// minified and skips re-minification (consistent with guide.min.js). The file is
		// already minified at build time, so re-minifying it is redundant.
		to: 'guide.min.css',
	},
];

module.exports = [
	/**
	 * The Boost plugin
	 */
	{
		entry: {
			index: './app/assets/src/js/index.tsx',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './app/assets/dist' ),
			filename: 'jetpack-boost.js',
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
			minimizer: [
				/**
				 * mck89/peast (used by wp i18n make-pot) can't correctly parse a ParenthesizedExpression generated from react-router.
				 * Somehow, setting this causes that code from react-router to be tree-shaken out.
				 */
				jetpackWebpackConfig.TerserPlugin( {
					terserOptions: {
						enclose: true,
					},
				} ),
				jetpackWebpackConfig.CssMinimizerPlugin(),
			],

			splitChunks: {
				minChunks: 2,
			},
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
			alias: {
				...jetpackWebpackConfig.resolve.alias,
				$lib: path.resolve( './app/assets/src/js/lib' ),
				$features: path.resolve( './app/assets/src/js/features' ),
				$layout: path.resolve( './app/assets/src/js/layout' ),
				$svg: path.resolve( './app/assets/src/js/svg' ),
				$css: path.resolve( './app/assets/src/css' ),
				$images: path.resolve( './app/assets/static/images' ),
			},
			// These are needed for the build to work,
			// otherwise it errors out because of the clean-css dependency.
			fallback: {
				...jetpackWebpackConfig.resolve.fallback,
				path: require.resolve( 'path-browserify' ),
				process: require.resolve( 'process/browser' ),
				url: false,
				https: false,
				http: false,
				os: false,
				buffer: false,
				events: false,
				fs: false,
			},
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: {
					filename: 'jetpack-boost.css',
				},
				DependencyExtractionPlugin: {
					requestMap: {
						// Bundle @wordpress/theme and @wordpress/private-apis inline —
						// they're transitive deps of @wordpress/ui but aren't registered
						// as script handles in WP core, so externalizing them breaks enqueue.
						'@wordpress/theme': { external: false },
						'@wordpress/private-apis': { external: false },
					},
				},
			} ),
			new webpack.ProvidePlugin( {
				process: require.resolve( 'process/browser' ),
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
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				// Workarounds for non-extracted `@wordpress/*` packages.
				...jetpackWebpackConfig.BundledWpPkgsTranspileRules(),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-boost',
			} ),
		},
	},

	/**
	 * Image Guide UI.
	 */
	{
		entry: {
			index: './app/modules/image-guide/src/index.ts',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			path: path.resolve( './app/modules/image-guide/dist' ),
			// Ship as `.min.js` so Boost's own concatenation serving path treats it as
			// already-minified and skips re-minification. The MatthiasMullie PHP minifier
			// is ES5-era and silently corrupts the Svelte/ES6 template literals in this
			// bundle; webpack/Terser has already minified it at build time.
			filename: 'guide.min.js',
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
			alias: {
				...jetpackWebpackConfig.resolve.alias,
				$lib: path.resolve( './app/assets/src/js/lib' ),
			},
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins(),
			new CopyPlugin( { patterns: imageGuideCopyPatterns } ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-boost',
			} ),
		},
	},

	/**
	 * LIAR - Lazy Image Auto Resizer
	 */
	{
		entry: {
			inlineScript: './app/modules/optimizations/image-cdn/src/liar.ts',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			path: path.resolve( './app/modules/optimizations/image-cdn/dist' ),
			filename: 'inline-liar.js',
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
		},
	},
];
