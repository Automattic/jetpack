const I18nSafeMangleExportsPlugin = require( '../../../src/I18nSafeMangleExportsPlugin.js' );

module.exports = [
	{
		mode: 'production',
		entry: './src/index.mjs',
		devtool: false,
		node: false,
		output: {
			filename: 'control.js',
		},
		optimization: {
			concatenateModules: false,
			mangleExports: true,
		},
	},
	{
		mode: 'production',
		entry: './src/index.mjs',
		devtool: false,
		node: false,
		output: {
			filename: 'plugin.js',
		},
		optimization: {
			concatenateModules: false,
			mangleExports: false,
		},
		plugins: [
			new I18nSafeMangleExportsPlugin(),
		],
	},
];
