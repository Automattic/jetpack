const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );

const entry = {};

module.exports =
	Object.keys( entry ).length === 0
		? []
		: [
				{
					entry,
					mode: jetpackWebpackConfig.mode,
					devtool: jetpackWebpackConfig.devtool,
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
					plugins: [ ...jetpackWebpackConfig.StandardPlugins() ],
					module: {
						strictExportPresence: true,
						rules: [
							// Transpile JavaScript/TypeScript.
							jetpackWebpackConfig.TranspileRule( {
								exclude: /node_modules\//,
							} ),

							// Transpile @automattic/jetpack-* in node_modules too.
							jetpackWebpackConfig.TranspileRule( {
								includeNodeModules: [ '@automattic/jetpack-' ],
							} ),
						],
					},
					externals: {
						...jetpackWebpackConfig.externals,
					},
				},
		  ];
