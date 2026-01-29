/**
 * Webpack config for the block-icons extractor script.
 * Builds the runner (which imports all block icon.js modules) for Node so we can
 * run it and emit src/modules/block-icons.generated.json for Interactivity API use.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

export default {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	target: 'node',
	entry: path.join( __dirname, 'extract-block-icons-runner.js' ),
	output: {
		path: path.join( __dirname, '..', 'dist' ),
		filename: 'extract-block-icons.cjs',
		library: {
			type: 'commonjs2',
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	externals: [
		'fs',
		'path',
		'url',
		'react',
		'react-dom/server',
		'@wordpress/element',
		'@wordpress/components',
		'@wordpress/icons',
	],
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( {
				exclude: /node_modules\//,
			} ),
		],
	},
};
