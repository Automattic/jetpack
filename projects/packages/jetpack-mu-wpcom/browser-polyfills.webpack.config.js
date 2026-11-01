const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

// The oldest browsers users are stuck on: macOS 10.12 (Chrome 103), Windows 7/8.1 (Firefox 115 ESR),
// macOS 10.15 and iOS 15 (Safari 15.6). Babel keeps only the core-js modules these lack.
const targets = [
	'chrome >= 103',
	'edge >= 103',
	'firefox >= 115',
	'safari >= 15.6',
	'ios_saf >= 15.6',
];

const babelOpts = {
	configFile: false,
	targets,
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			// The default rewrites core-js imports into a wp-polyfill dependency, which lacks most of these.
			{ autoWpPolyfill: false },
		],
	],
	plugins: [
		// The plugin rather than preset-env's useBuiltIns, which Babel 8 removes.
		[
			'babel-plugin-polyfill-corejs3',
			{ method: 'entry-global', version: require( 'core-js/package.json' ).version },
		],
	],
};

module.exports = {
	babelOpts,
	config: {
		entry: {
			'browser-polyfills': './src/features/browser-polyfills/index.js',
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			filename: '[name]/[name].js',
			path: path.resolve( __dirname, 'src/build' ),
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
		module: {
			strictExportPresence: true,
			rules: [ jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\//, babelOpts } ) ],
		},
	},
};
