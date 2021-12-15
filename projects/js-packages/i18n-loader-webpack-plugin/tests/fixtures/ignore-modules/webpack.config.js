const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );
const DependencyExtractionPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

const filters = {
	string: 'src/hasI18n.js',
	regex: /\/hasI18n(?:\.js)?$/,
	function: n => n.endsWith( '/hasI18n.js' ),
	array: [ 'src/hasI18n.js' ],
};

module.exports = Object.entries( filters ).map( ( [ k, v ] ) => ( {
	target: 'async-node',
	mode: 'development',
	devtool: false,
	entry: {
		main: './src/index.js',
		main2: './src/index2.js',
	},
	output: {
		filename: k + '/[name].js',
		chunkFilename: k + '/[name].js',
		library: {
			type: 'commonjs2',
		},
	},
	plugins: [
		new I18nLoaderPlugin( {
			textdomain: 'ignore-modules',
			ignoreModules: v,
		} ),
		new DependencyExtractionPlugin(),
	],
} ) );
