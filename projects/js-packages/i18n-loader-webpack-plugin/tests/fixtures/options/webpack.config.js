const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );
const DependencyExtractionPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

module.exports = [
	{
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
			new I18nLoaderPlugin( {
				textdomain: 'options',
				loaderModule: 'loader',
				loaderMethod: 'doload',
				target: 'core',
				path: 'jetpack_vendor/automattic/jetpack-foobar/dist',
			} ),
		],
		externals: {
			'@wordpress/i18n': 'global wpI18n',
			loader: 'global optionLoader',
		},
	},
	{
		target: 'async-node',
		mode: 'development',
		devtool: false,
		entry: {
			main2: './src/index.js',
		},
		output: {
			chunkFilename: '[name].js',
			library: {
				type: 'commonjs2',
			},
		},
		plugins: [
			new I18nLoaderPlugin( {
				textdomain: 'options',
				loaderModule: '@wordpress/i18n',
			} ),
			new DependencyExtractionPlugin(),
		],
	},
];
