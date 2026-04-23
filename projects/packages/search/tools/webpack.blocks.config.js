const fs = require( 'fs' );
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const blocksSrcDir = path.join( __dirname, '../src/search-blocks/blocks' );

/**
 * Build a webpack entry map for each block's `view.js`, keyed by block directory name.
 *
 * @return {Object<string, string>} Entry map for webpack.
 */
function readBlockViewEntries() {
	if ( ! fs.existsSync( blocksSrcDir ) ) {
		return {};
	}
	return fs
		.readdirSync( blocksSrcDir, { withFileTypes: true } )
		.filter( dirent => dirent.isDirectory() )
		.reduce( ( acc, dirent ) => {
			const viewPath = path.join( blocksSrcDir, dirent.name, 'view.js' );
			if ( fs.existsSync( viewPath ) ) {
				acc[ dirent.name ] = viewPath;
			}
			return acc;
		}, {} );
}

const blockViewEntries = readBlockViewEntries();

// Also include the shared store module so it can be imported by view.js files.
const storeIndexPath = path.join( __dirname, '../src/search-blocks/store/index.js' );
const storeEntries = fs.existsSync( storeIndexPath ) ? { 'store/index': storeIndexPath } : {};

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		...storeEntries,
		...blockViewEntries,
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/search-blocks' ),
		module: true,
		chunkFormat: 'module',
		environment: { module: true },
		library: { type: 'module' },
		filename: '[name].js',
	},
	experiments: {
		outputModule: true,
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [
			path.resolve( __dirname, '../src/search-blocks' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ),
		],
	},
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\// } ),
			jetpackWebpackConfig.TranspileRule( { includeNodeModules: [ '@automattic/jetpack-' ] } ),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: { injectPolyfill: false },
			// I18nLoaderPlugin tries to inject @wordpress/jp-i18n-loader as an
			// import, which isn't supported by the DependencyExtractionPlugin
			// in ESM/module output mode. Disable for this build.
			I18nLoaderPlugin: false,
		} ),
	],
};
