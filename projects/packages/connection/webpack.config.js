const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const glob = require( 'glob' );

const ssoEntries = {};
// Add all js files in the src/sso directory.
for ( const file of glob.sync( './src/sso/*.js' ) ) {
	const name = path.basename( file, path.extname( file ) );
	ssoEntries[ name ] = file;
}
// Add all css files as well.
for ( const file of glob.sync( './src/sso/*.css' ) ) {
	const name = path.basename( file, path.extname( file ) );
	ssoEntries[ name ] = file;
}

module.exports = [
	{
		entry: {
			'tracks-ajax': './src/js/tracks-ajax.js',
			'tracks-callables': {
				import: './src/js/tracks-callables.js',
				library: {
					name: 'analytics',
					type: 'window',
				},
			},
			...ssoEntries,
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './dist' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins( {
				MiniCssExtractPlugin: { filename: '[name].css' },
			} ),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript, including node_modules.
				jetpackWebpackConfig.TranspileRule(),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css' ],
				} ),
			],
		},
	},
];
