const I18nLoaderPlugin = require( '../../../src/I18nLoaderPlugin.js' );

const shared = {
	target: 'async-node',
	mode: 'development',
	devtool: false,
	output: {
		chunkFilename: '[name].js',
		library: {
			type: 'commonjs2',
		},
	},
	plugins: [ new I18nLoaderPlugin( { textdomain: 'manual-externals' } ) ],
};

module.exports = [
	{
		...shared,
		entry: {
			main: './src/index.js',
		},
		externals: {
			'@wordpress/i18n': 'global wpI18n',
			'@wordpress/jp-i18n-state': 'global jpI18nState',
		},
	},
	{
		...shared,
		entry: {
			main2: './src/index.js',
		},
		externals: {
			'@wordpress/i18n': 'global wpI18n',
			'@wordpress/jp-i18n-state':
				'var ' +
				JSON.stringify( {
					baseUrl: 'http://example.org/',
					locale: 'en_US',
					domainMap: {},
				} ),
		},
	},
	{
		...shared,
		entry: {
			main3: './src/index.js',
		},
		externals: {
			'@wordpress/i18n': 'global wpI18n',
			'@wordpress/jp-i18n-state':
				'var ' +
				JSON.stringify( {
					baseUrl: 'http://example.org/',
					locale: 'en_us',
					domainMap: {
						'manual-externals': 'themes/remapped',
					},
				} ),
		},
	},
];
