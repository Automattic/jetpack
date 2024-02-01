/**
 * Builds the forms dashboard JS bundle.
 */

const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: jetpackWebpackConfig.mode,
	entry: {
		[ 'jetpack-forms-dashboard' ]: path.join( __dirname, '..', 'src/dashboard/index.js' ),
		[ 'jetpack-forms-dashboard.wpcom' ]: path.join(
			__dirname,
			'..',
			'src/dashboard/style.wpcom.scss'
		),
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '..', 'dist/dashboard' ),
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
	externals: {
		...jetpackWebpackConfig.externals,
		jetpackConfig: JSON.stringify( {
			consumer_slug: 'jetpack-forms',
		} ),
	},
	module: {
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
				extraLoaders: [ 'sass-loader' ],
			} ),

			// Handle images.
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
};
