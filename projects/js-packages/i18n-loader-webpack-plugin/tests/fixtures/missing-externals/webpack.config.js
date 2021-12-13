const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );

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
	plugins: [ new I18nLoaderPlugin( { textdomain: 'missing-externals' } ) ],
	externals: {
		'@wordpress/i18n': 'global wpI18n',
	},
};
