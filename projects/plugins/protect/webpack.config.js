const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const ReactRefreshWebpackPlugin = require( '@pmmmwh/react-refresh-webpack-plugin' );
const webpack = require( 'webpack' );

module.exports = [
	{
		entry: {
			index: [
				'webpack-dev-server/client?http://localhost:3000',
				'webpack/hot/dev-server',
				'./src/js/index.tsx',
			],
		},
		mode: jetpackWebpackConfig.mode,
		devtool: jetpackWebpackConfig.devtool,
		output: {
			...jetpackWebpackConfig.output,
			path: path.resolve( './build' ),
			publicPath: 'http://localhost:3000/',
		},
		optimization: {
			...jetpackWebpackConfig.optimization,
		},
		resolve: {
			...jetpackWebpackConfig.resolve,
		},
		node: false,
		plugins: [
			...jetpackWebpackConfig.StandardPlugins(),
			new webpack.HotModuleReplacementPlugin(),
			new ReactRefreshWebpackPlugin(),
		],
		module: {
			strictExportPresence: true,
			rules: [
				// Transpile JavaScript
				jetpackWebpackConfig.TranspileRule( {
					exclude: /node_modules\//,
				} ),

				// Transpile @automattic/jetpack-* in node_modules too.
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@automattic/jetpack-' ],
				} ),

				/**
				 * Transpile @wordpress/dataviews in node_modules too.
				 *
				 * @see https://github.com/Automattic/jetpack/issues/39907
				 */
				jetpackWebpackConfig.TranspileRule( {
					includeNodeModules: [ '@wordpress/dataviews/' ],
					babelOpts: {
						configFile: false,
						plugins: [
							[
								require.resolve( '@automattic/babel-plugin-replace-textdomain' ),
								{ textdomain: 'jetpack-protect' },
							],
						],
					},
				} ),

				// Handle CSS.
				jetpackWebpackConfig.CssRule( {
					extensions: [ 'css', 'sass', 'scss' ],
					extraLoaders: [ 'sass-loader' ],
				} ),

				// Handle images.
				jetpackWebpackConfig.FileRule(),

				// React Refresh
				{
					test: /\.jsx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: 'babel-loader',
							options: {
								plugins: [ 'react-refresh/babel' ], // Add this plugin for React Fast Refresh
							},
						},
					],
				},
			],
		},
		externals: {
			...jetpackWebpackConfig.externals,
			jetpackConfig: JSON.stringify( {
				consumer_slug: 'jetpack-protect',
			} ),
		},
		devServer: {
			// static: {
			// 	directory: path.resolve( './build' ),
			// },
			static: false,
			port: 3000,
			proxy: [
				{
					context: [ '/wp-admin' ],
					target: 'https://njweller.jurassic.tube',
					changeOrigin: true,
					// ws: true,
				},
			],
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
			client: {
				webSocketURL: {
					hostname: 'localhost',
					port: 3000,
					protocol: 'ws', // Use `wss` if using HTTPS
				},
			},
			hot: true,
			liveReload: false,
			devMiddleware: {
				writeToDisk: true,
			},
			allowedHosts: [ 'localhost', 'localhost:3000', 'njweller.jurassic.tube' ],
		},
	},
];
