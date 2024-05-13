const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const glob = require( 'glob' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build' ),
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
			consumer_slug: 'jetpack-masterbar',
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
			MiniCssWithRtlPlugin: false,
			WebpackRtlPlugin: false,
		} ),
	],
};

const masterbarCssEntriesForAdminColorSchemes = {};
// prettier-ignore
for ( const file of glob
	.sync( 'src/admin-color-schemes/colors/**/*.scss' )
	.filter( n => ! path.basename( n ).startsWith( '_' ) )
) {
	masterbarCssEntriesForAdminColorSchemes[ file.substring( 4, file.length - 5 ) ] = './' + file;
}

const masterBarJsFiles = {};
for ( const file of glob
	.sync( 'src/**/*.js' )
	.filter( name => ! name.endsWith( '.min.js' ) && name.indexOf( '/test/' ) < 0 ) ) {
	masterBarJsFiles[ file.substring( 4, file.length - 3 ) ] = './' + file;
}

const masterBarCssFiles = {};
for ( const file of glob
	.sync( 'src/**/*.css' )
	.filter( name => name.indexOf( '/admin-color-schemes/' ) < 0 ) ) {
	masterBarCssFiles[ file.substring( 4, file.length - 4 ) ] = './' + file;
}

module.exports = [
	{
		...sharedWebpackConfig,
		entry: masterbarCssEntriesForAdminColorSchemes,
		plugins: [
			...sharedWebpackConfig.plugins,
			// Delete the dummy JS files Webpack would otherwise create.
			new RemoveAssetWebpackPlugin( {
				assets: /\.js(\.map)?$/,
			} ),
		],
	},
	{
		...sharedWebpackConfig,
		entry: masterBarJsFiles,
	},
	{
		...sharedWebpackConfig,
		entry: masterBarCssFiles,
		plugins: [
			...sharedWebpackConfig.plugins,
			...jetpackWebpackConfig.MiniCssWithRtlPlugin(),
			...jetpackWebpackConfig.WebpackRtlPlugin(),
			// Delete the dummy JS files Webpack would otherwise create.
			new RemoveAssetWebpackPlugin( {
				assets: /\.js(\.map)?$/,
			} ),
		],
	},
];
