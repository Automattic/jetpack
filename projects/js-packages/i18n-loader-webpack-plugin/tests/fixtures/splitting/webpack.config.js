const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );
const DependencyExtractionPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	target: 'async-node',
	mode: 'development',
	devtool: false,
	entry: {
		main: './src/index1.js',
		main2: './src/index2.js',
	},
	output: {
		chunkFilename: '[name].js',
		library: {
			type: 'commonjs2',
		},
	},
	optimization: {
		splitChunks: {
			minSize: 1,
		},
	},
	plugins: [
		new I18nLoaderPlugin( { textdomain: 'splitting' } ),
		new DependencyExtractionPlugin(),
	],
};
