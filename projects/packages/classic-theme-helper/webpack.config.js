const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const { glob } = require( 'glob' );

const sharedWebpackConfig = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: jetpackWebpackConfig.output,
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
				extensions: [ 'css' ],
			} ),
		],
	},
	plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
};

const classicThemeHelperFiles = {};
for ( const file of glob
	.sync( 'src/**/*.js' )
	.filter( name => ! name.endsWith( '.min.js' ) && name.indexOf( '/test/' ) < 0 ) ) {
	classicThemeHelperFiles[ file.substring( 4, file.length - 3 ) ] = './' + file;
}

module.exports = [
	{
		...sharedWebpackConfig,
		entry: classicThemeHelperFiles,
	},
];
