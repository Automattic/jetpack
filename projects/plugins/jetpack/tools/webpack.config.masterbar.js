const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const RemoveAssetWebpackPlugin = require( '@automattic/remove-asset-webpack-plugin' );
const glob = require( 'glob' );
const webpack = jetpackWebpackConfig.webpack;

const masterbarCssEntries = {};
if ( process.env.MASTERBAR_ENV === 'wpcom' ) {
	// prettier-ignore
	for ( const file of glob
		.sync( '../masterbar/admin-color-schemes/colors/**/*.scss' )
		.filter( n => ! path.basename( n ).startsWith( '_' ) )
	) {
		masterbarCssEntries[ file.substring( 13, file.length - 5 ) ] = file;
	}
} else {
	// prettier-ignore
	for ( const file of glob
		.sync( 'modules/masterbar/admin-color-schemes/colors/**/*.scss' )
		.filter( n => ! path.basename( n ).startsWith( '_' ) )
	) {
		masterbarCssEntries[ file.substring( 18, file.length - 5 ) ] = './' + file;
	}
}

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: false,
	entry: masterbarCssEntries,
	output: {
		...jetpackWebpackConfig.output,
		path: path.join(
			__dirname,
			process.env.MASTERBAR_ENV === 'wpcom' ? '../../masterbar' : '../_inc/build/masterbar'
		),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
		minimizer: [
			jetpackWebpackConfig.CssMinimizerPlugin( {
				minimizerOptions: {
					preset: [
						'default',
						{
							discardComments: {
								remove: comment => comment !== 'NOAUTORTL' && ! comment.startsWith( '!' ),
							},
						},
					],
				},
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
					'sass-loader',
				],
			} ),
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
		// Delete the dummy JS files Webpack would otherwise create.
		new RemoveAssetWebpackPlugin( {
			assets: /\.js(\.map)?$/,
		} ),
		// Add wpcom's "NOAUTORTL" comment.
		new webpack.BannerPlugin( {
			banner: '/* NOAUTORTL */\n',
			raw: true,
		} ),
	],
};
