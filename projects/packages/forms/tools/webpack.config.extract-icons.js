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
import jetpackWebpackConfig from '@automattic/jetpack-webpack-config/webpack';

const __dirname = import.meta.dirname;

/**
 * Icon pipeline configuration.
 *
 * Shared by extract-icons.mjs and rasterize-icons.mjs — centralises all
 * directory paths and file-matching rules so the scripts stay generic.
 */
export const iconPipelineConfig = {
	formsRoot: path.join( __dirname, '..' ),
	blocksDir: path.join( __dirname, '..', 'src', 'blocks' ),
	blockDirPattern: 'field-*',
	iconFilenames: [ 'icon.jsx', 'icon.tsx', 'icon.js' ],
	svgFilename: 'icon.svg',
	rasterOutputDir: path.join( __dirname, '..', 'src', 'contact-form', 'images', 'field-icons' ),
	rasterSuffix: '@2x',
	fileIconsDir: path.join( __dirname, '..', 'src', 'contact-form', 'images', 'file-icons' ),
};

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
