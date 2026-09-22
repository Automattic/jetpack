const path = require( 'node:path' );
const config = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	mode: 'development',
	devtool: false,
	entry: path.join( __dirname, 'history-tooltip-entry.jsx' ),
	output: { filename: 'history-tooltip.js' },
	resolve: { ...config.resolve, conditionNames: [ 'jetpack:src', '...' ] },
	plugins: config.StandardPlugins( {
		DependencyExtractionPlugin: false,
		I18nLoaderPlugin: false,
		MiniCssExtractPlugin: { filename: 'history-tooltip.css' },
	} ),
	module: {
		rules: [
			config.TranspileRule( { exclude: /node_modules\// } ),
			config.TranspileRule( { includeNodeModules: [ '@automattic/jetpack-' ] } ),
			...config.BundledWpPkgsTranspileRules( { textdomain: 'jetpack-boost' } ),
			config.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
			} ),
			config.FileRule(),
		],
	},
};
