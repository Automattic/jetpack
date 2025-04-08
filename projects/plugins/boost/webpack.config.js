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

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
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
			filename: 'guide.js',
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
