const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );
const DependencyExtractionPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	target: 'async-node',
	mode: 'development',
	devtool: false,
	entry: {
		main: './src/index.js',
		bar: './src/bar.js',
		baz: './src/baz.js',
	},
	output: {
		chunkFilename: '[name].js',
		library: {
			type: 'commonjs2',
		},
	},
	plugins: [
		new I18nLoaderPlugin( { textdomain: 'basic-test' } ),
		new DependencyExtractionPlugin(),
	],
};
