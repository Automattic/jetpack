const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );
const DependencyExtractionPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	target: 'async-node',
	mode: 'development',
	devtool: false,
	entry: {
		main: './src/index.js',
	},
	output: {
		chunkFilename: '[name].js',
		library: {
			type: 'commonjs2',
		},
	},
	plugins: [
		new I18nLoaderPlugin( { textdomain: 'nested-includes' } ),
		new DependencyExtractionPlugin(),
	],
};
