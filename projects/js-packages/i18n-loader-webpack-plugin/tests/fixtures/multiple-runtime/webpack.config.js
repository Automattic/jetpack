const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );
const DependencyExtractionPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = {
	target: 'async-node',
	mode: 'development',
	devtool: false,
	entry: {
		main: './src/index.js',
		main2: './src/index2.js',
		bar: './src/bar.js',
		baz: './src/baz.js',
	},
	output: {
		chunkFilename: '[name].js',
		library: {
			type: 'commonjs2',
		},
	},
	optimization: {
		runtimeChunk: true,
	},
	plugins: [
		new I18nLoaderPlugin( { textdomain: 'multiple-runtime' } ),
		new DependencyExtractionPlugin(),
	],
};
