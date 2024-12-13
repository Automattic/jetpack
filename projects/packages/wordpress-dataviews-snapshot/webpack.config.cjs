const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const ver = require( '@wordpress/dataviews/package.json' ).version;

const dependencyData = {
	external: [ 'JetpackWpDataViewsSnapshot', ver ],
	handle: `jetpack-wp-dataviews-snapshot-${ ver }`,
};

class WriteHandlePlugin {
	apply( compiler ) {
		compiler.hooks.emit.tapAsync( 'WriteHandlePlugin', ( compilation, callback ) => {
			const content = JSON.stringify( dependencyData );
			compilation.assets[ 'dependency-data.json' ] = {
				source: () => content,
				size: () => content.length,
			};
			callback();
		} );
	}
}

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	performance: false,
	entry: {
		dataviews: {
			import: './src/wp-dataviews.js',
			library: {
				name: dependencyData.external,
				type: 'window',
			},
		},
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( './build' ),
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
	},
	node: false,
	module: {
		strictExportPresence: true,
		rules: [
			// Transpile JavaScript, including node_modules.
			jetpackWebpackConfig.TranspileRule(),

			// Add textdomains (but no other optimizations) for @wordpress/dataviews.
			jetpackWebpackConfig.TranspileRule( {
				includeNodeModules: [ '@wordpress/dataviews/' ],
				babelOpts: {
					configFile: false,
					plugins: [
						[
							require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
							{ textdomain: 'jetpack-wordpress-dataviews-snapshot' },
						],
					],
				},
			} ),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			MiniCssExtractPlugin: { filename: '[name].css' },
			DependencyExtractionPlugin: {
				requestMap: {
					// We don't want to externalize this package, we rather want to bundle it.
					'@wordpress/dataviews/wp': {},
				},
			},
		} ),
		new WriteHandlePlugin(),
	],
};
