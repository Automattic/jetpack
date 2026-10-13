const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

module.exports = {
	entry: './src/index.ts',
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	output: {
		...jetpackWebpackConfig.output,
		path: path.resolve( __dirname, 'build' ),
		filename: 'index.js',
		library: { type: 'module' },
		module: true,
		chunkFormat: 'module',
	},
	experiments: { outputModule: true },
	optimization: {
		...jetpackWebpackConfig.optimization,
		concatenateModules: true,
	},
	resolve: jetpackWebpackConfig.resolve,
	watchOptions: jetpackWebpackConfig.watchOptions,
	externalsType: 'module',
	externals: ( { request }, callback ) => {
		if ( /^(?:react(?:-dom)?(?:\/|$)|@wordpress\/)/.test( request ) ) {
			return callback( null, request );
		}
		callback();
	},
	plugins: jetpackWebpackConfig.StandardPlugins( {
		DependencyExtractionPlugin: false,
		I18nCheckPlugin: false,
		I18nLoaderPlugin: false,
		I18nSafeMangleExportsPlugin: false,
		MiniCssExtractPlugin: { filename: 'guide.css' },
		MiniCssWithRtlPlugin: false,
		WebpackRtlPlugin: false,
	} ),
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( {
				include: path.resolve( __dirname, 'src' ),
				babelOpts: {
					configFile: false,
					presets: [
						[
							require.resolve( '@automattic/jetpack-webpack-config/babel/preset' ),
							{ autoWpPolyfill: false, pluginTransformRuntime: false },
						],
					],
				},
			} ),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'scss' ],
				// Boost copies only guide.css, so it cannot resolve a separate CSS source map.
				CssLoader: { sourceMap: false },
				extraLoaders: [
					{
						loader: require.resolve( 'sass-loader' ),
						options: {
							implementation: require( 'sass-embedded' ),
							sourceMap: false,
						},
					},
				],
			} ),
		],
	},
};
