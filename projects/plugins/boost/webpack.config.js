const path = require( 'path' );
// eslint-disable-next-line import/no-extraneous-dependencies
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
// eslint-disable-next-line import/no-extraneous-dependencies
const CopyPlugin = require( 'copy-webpack-plugin' );

const isProduction = process.env.NODE_ENV === 'production';

const cssGenPath = path.dirname(
	path.dirname( require.resolve( 'jetpack-boost-critical-css-gen' ) )
);

const cssGenCopyPatterns = [
	{
		from: path.join( cssGenPath, 'dist/bundle.js' ),
		to: 'critical-css-gen.js',
	},
];

if ( ! isProduction ) {
	cssGenCopyPatterns.push( {
		from: path.join( cssGenPath, 'dist/bundle.js.map' ),
		to: 'critical-css-gen.js.map',
	} );
}

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
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: {
					filename: 'jetpack-boost.css',
				},
				DependencyExtractionPlugin: { injectPolyfill: true },
			} ),
			new CopyPlugin( { patterns: cssGenCopyPatterns } ),
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
			...jetpackWebpackConfig.StandardPlugins( {
				DependencyExtractionPlugin: { injectPolyfill: true },
			} ),
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
];
