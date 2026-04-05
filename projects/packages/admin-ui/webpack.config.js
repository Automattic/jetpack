const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = [
	{
		entry: {
			'admin-ui-upgrade-menu': './src/admin-ui-upgrade-menu.scss',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			path: path.resolve( './build' ),
		},
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		module: {
			rules: [
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ { loader: 'sass-loader', options: { api: 'modern-compiler' } } ],
				} ),
			],
		},
	},
];
