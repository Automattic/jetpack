/**
 * External dependencies
 */
const DependencyExtractionWebpackPlugin = require('@wordpress/dependency-extraction-webpack-plugin');
const getBaseWebpackConfig = require('@automattic/calypso-build/webpack.config.js');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');

const isDevelopment = process.env.NODE_ENV !== 'production';

const baseWebpackConfig = getBaseWebpackConfig(
	{ WP: false },
	{
		entry: {}, // We'll override later
		'output-filename': '[name].js',
		'output-chunk-filename': '[name].[contenthash].js',
		'output-path': path.join(__dirname, 'build'),
		// Calypso-build defaults this to "window", which breaks things if no library.name is set.
		'output-library-target': '',
	}
);

module.exports = [
	{
		...baseWebpackConfig,
		devtool: isDevelopment ? 'source-map' : false,
		entry: {
			dashboard: path.join(__dirname, './src/dashboard/entry.js'),
		},
		node: {},
		optimization: {
			...baseWebpackConfig.optimization,
			// This optimization sometimes causes webpack to drop `__()` and such.
			concatenateModules: false,
		},
		plugins: [
			...baseWebpackConfig.plugins,
			new NodePolyfillPlugin(),
			new DependencyExtractionWebpackPlugin({ injectPolyfill: true }),
		],
		resolve: {
			...baseWebpackConfig.resolve,
			modules: ['node_modules'],
			// We want the compiled version, not the "calypso:src" sources.
			mainFields: baseWebpackConfig.resolve.mainFields.filter(entry => 'calypso:src' !== entry),
			alias: {
				...baseWebpackConfig.resolve.alias,
				fs: false,
			},
		},
	},
];
