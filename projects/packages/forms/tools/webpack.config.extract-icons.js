/**
 * Webpack config for the block-icons extraction script.
 *
 * Bundles the generated runner (which imports all block icon modules) for Node
 * so we can render React icon components to static SVG markup.
 *
 * The WordPress components package is aliased to a lightweight mock since we
 * extract the inner icon element from props rather than rendering through the
 * Icon wrapper. This avoids needing a DOM (jsdom) at runtime.
 */
import path from 'path';
import { fileURLToPath } from 'url';
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

export default {
	mode: 'production',
	devtool: false,
	target: 'node',
	entry: path.join( __dirname, '.extract-icons-runner.js' ),
	output: {
		path: path.join( __dirname, '..', 'dist' ),
		filename: 'extract-icons-bundle.cjs',
		library: {
			type: 'commonjs2',
		},
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		alias: {
			...( jetpackWebpackConfig.resolve?.alias || {} ),
			'@wordpress/components': path.join( __dirname, '.mock-wp-components.js' ),
		},
	},
	externals: [
		'react',
		'react-dom',
		'react-dom/server',
		'@wordpress/element',
		'@wordpress/primitives',
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
