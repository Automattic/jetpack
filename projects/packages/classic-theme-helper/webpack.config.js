const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const glob = require( 'glob' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [ 'node_modules' ],
		alias: {
			...jetpackWebpackConfig.resolve.alias,
			fs: false,
		},
	},
	node: {},
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-classic-theme-helper',
		} ),
	},
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),

			// Handle CSS.
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { plugins: [ require( 'autoprefixer' ) ] },
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
			MiniCssWithRtlPlugin: true,
			WebpackRtlPlugin: false,
		} ),
	],
};

const responsiveVideosFiles = {};
for ( const file of glob
	.sync( 'src/**/*.js' )
	.filter( name => ! name.endsWith( '.min.js' ) && name.indexOf( '/test/' ) < 0 ) ) {
	responsiveVideosFiles[ file.substring( 4, file.length - 3 ) ] = './' + file;
}

module.exports = [
	{
		...sharedWebpackConfig,
		entry: responsiveVideosFiles,
	},
];
