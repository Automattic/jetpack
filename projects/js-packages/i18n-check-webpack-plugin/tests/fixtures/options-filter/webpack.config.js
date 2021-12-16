process.env.NODE_ENV = 'production';

// Cross-project deps are ugh, but pnpm whines about "cyclic dependencies" if we try to make it an actual devDepenency.
const jetpackWebpackConfig = require( '../../../../webpack-config/src/webpack.js' );

const filters = {
	string: 'src/string.js',
	regex: /\/regex(?:\.js)?$/,
	function: n => n.endsWith( '/func.js' ),
	array: [ 'src/arr.js' ],
	undefined: undefined,
};

module.exports = Object.entries( filters ).map( ( [ k, v ] ) => ( {
	name: k,
	entry: './src/index.js',
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		filename: k + '/[name].js',
		chunkFilename: k + '/[name].js',
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: jetpackWebpackConfig.resolve,
	node: false,
	plugins: jetpackWebpackConfig.StandardPlugins( {
		I18nCheckPlugin: {
			filter: v,
		},
	} ),
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule(),
		],
	},
} ) );
